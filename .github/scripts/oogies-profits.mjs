// Writes the totals behind the "Current profits" section on oogies.nl: items sold and estimated
// profit for the current month, read from the Fourthwall Open API plus the sales listed in OFFLINE.
// No customer or order data is kept.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const API = process.env.FOURTHWALL_API || 'https://api.fourthwall.com/open-api/v1.0';
const RATES = process.env.RATES_API || 'https://api.frankfurter.dev/v1/latest';
const OUT = process.env.OUT || 'oogies/profits.json';
const OFFLINE = process.env.OFFLINE || '.github/scripts/oogies-offline-sales.json';
const TZ = 'Europe/Amsterdam';
const GOAL_EUR = 500;

// Fourthwall doesn't expose its payment fee, and it depends on how the customer paid.
// Card orders came out at 3.9% + $0.30, so estimating a bit higher keeps the number on the safe side.
const FEE_RATE = 0.045;
const FEE_FIXED = 0.3;

const { FOURTHWALL_USER, FOURTHWALL_PASSWORD } = process.env;
if (!FOURTHWALL_USER || !FOURTHWALL_PASSWORD) {
	throw new Error('Set FOURTHWALL_USER and FOURTHWALL_PASSWORD');
}
const auth = 'Basic ' + Buffer.from(`${FOURTHWALL_USER}:${FOURTHWALL_PASSWORD}`).toString('base64');

// Milliseconds that the wall clock in TZ is ahead of UTC at the given instant.
function tzOffset(ms) {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
		hour: 'numeric', minute: 'numeric', second: 'numeric',
	}).formatToParts(new Date(ms));
	const p = Object.fromEntries(parts.map(x => [x.type, Number(x.value)]));
	return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000;
}

function currentMonth(now) {
	const [year, month] = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit' })
		.format(now).split('-').map(Number);
	const midnight = Date.UTC(year, month - 1, 1);
	return {
		key: `${year}-${String(month).padStart(2, '0')}`,
		label: new Intl.DateTimeFormat('en-GB', { timeZone: TZ, month: 'long', year: 'numeric' }).format(now),
		start: new Date(midnight - tzOffset(midnight)),
	};
}

async function getJson(url, headers = {}) {
	const res = await fetch(url, { headers: { Accept: 'application/json', ...headers } });
	if (!res.ok) {
		throw new Error(`${res.status} from ${url.split('?')[0]}: ${(await res.text()).slice(0, 300)}`);
	}
	return res.json();
}

async function ordersSince(start) {
	const orders = [];
	for (let page = 0; ; page++) {
		const query = new URLSearchParams({ page, size: 100, 'createdAt[gt]': start.toISOString() });
		const body = await getJson(`${API}/order?${query}`, { Authorization: auth });
		orders.push(...body.results);
		if (body.results.length === 0 || page + 1 >= (body.totalPages ?? 1)) {
			return orders;
		}
	}
}

const value = money => Math.abs(money?.value ?? 0);

function orderProfit(order) {
	const { subtotal, discount, donation, total } = order.amounts;
	let profit = value(subtotal) - value(discount) + value(donation);
	for (const { variant } of order.offers) {
		profit -= value(variant.unitCost) * variant.quantity;
	}
	// Shipping and tax are passed straight through to Fourthwall, so they don't change the profit.
	return profit - (value(total) * FEE_RATE + FEE_FIXED);
}

// Sales made outside the website this month, with price and cost per item in the shop currency.
async function offlineSales(month) {
	const sales = await readFile(OFFLINE, 'utf8').then(JSON.parse, err => {
		if (err.code === 'ENOENT') {
			return [];
		}
		throw err;
	});
	for (const sale of sales) {
		if (typeof sale.date !== 'string' || ![sale.items, sale.price, sale.cost].every(Number.isFinite)) {
			throw new Error(`Offline sales need a date, items, price and cost: ${JSON.stringify(sale)}`);
		}
	}
	return sales.filter(sale => sale.date.startsWith(month.key));
}

// Euros per unit of the shop currency, and reais per euro for what the shelter receives.
async function getRates(currency, previous) {
	try {
		const symbols = ['EUR', 'BRL'].filter(symbol => symbol !== currency);
		const body = await getJson(`${RATES}?base=${currency}&symbols=${symbols.join(',')}`);
		const rates = { ...body.rates, [currency]: 1 };
		return { eur: rates.EUR, brlPerEur: Math.round(rates.BRL / rates.EUR * 10000) / 10000 };
	} catch (err) {
		if (previous?.currency === currency && previous.rate && previous.brl_per_eur) {
			console.warn(`Exchange rates unavailable, reusing the previous ones: ${err.message}`);
			return { eur: previous.rate, brlPerEur: previous.brl_per_eur };
		}
		throw err;
	}
}

const month = currentMonth(new Date());
const sales = (await ordersSince(month.start)).filter(order =>
	new Date(order.createdAt) >= month.start &&
	order.status !== 'CANCELLED' &&
	(order.source?.type ?? 'ORDER') === 'ORDER');

let items = 0;
let profit = 0;
for (const order of sales) {
	items += order.offers.reduce((sum, { variant }) => sum + variant.quantity, 0);
	profit += orderProfit(order);
}
const offline = await offlineSales(month);
for (const sale of offline) {
	items += sale.items;
	profit += sale.items * (sale.price - sale.cost);
}
profit = Math.round(profit * 100) / 100;

const previous = await readFile(OUT, 'utf8').then(JSON.parse).catch(() => null);
const currency = sales[0]?.amounts.total.currency ?? previous?.currency ?? 'USD';
const summary = `${month.label}: ${sales.length} orders, ${offline.length} offline sales, ${items} items, ${profit} ${currency}`;

// Only rewrite the file for a new month, new orders or a missing rate, so rate changes alone never cause a commit.
if (previous?.month === month.key && previous.items === items && previous.profit === profit &&
	previous.currency === currency && previous.rate && previous.brl_per_eur) {
	console.log(`${summary}, unchanged`);
} else {
	const { eur, brlPerEur } = await getRates(currency, previous);
	const result = {
		month: month.key,
		label: month.label,
		items,
		profit_eur: Math.round(profit * eur * 100) / 100,
		goal_eur: GOAL_EUR,
		brl_per_eur: brlPerEur,
		profit,
		currency,
		rate: eur,
	};
	await mkdir(dirname(OUT), { recursive: true });
	await writeFile(OUT, JSON.stringify(result, null, 2) + '\n');
	console.log(`${summary} = €${result.profit_eur}`);
}
