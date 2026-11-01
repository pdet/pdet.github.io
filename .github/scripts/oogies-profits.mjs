// Writes the totals behind the "Current profits" section on oogies.nl: items sold and estimated
// profit for one month, read from the Fourthwall Open API plus the sales listed in OFFLINE.
// The bar shows the current month once it has a sale. Until then it keeps last month's final result,
// so it doesn't reset to zero on the 1st and a sale in the last hours of a month still gets counted.
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

// The calendar month (1-12) of the given year, starting at midnight in TZ on the 1st.
function monthAt(year, month) {
	const midnight = Date.UTC(year, month - 1, 1);
	return {
		key: `${year}-${String(month).padStart(2, '0')}`,
		label: new Intl.DateTimeFormat('en-GB', { timeZone: TZ, month: 'long', year: 'numeric' })
			.format(new Date(Date.UTC(year, month - 1, 15))),
		start: new Date(midnight - tzOffset(midnight)),
	};
}

function currentMonth(now) {
	const [year, month] = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit' })
		.format(now).split('-').map(Number);
	return monthAt(year, month);
}

function monthBefore(month) {
	const [year, number] = month.key.split('-').map(Number);
	return number === 1 ? monthAt(year - 1, 12) : monthAt(year, number - 1);
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

// Sales made outside the website, with the date and the price and cost per item in the shop currency.
async function offlineSales() {
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
	return sales;
}

// Items sold and profit in a month: the orders placed from its start up to `end`, plus its offline sales.
function monthTotals(month, end, orders, offline) {
	const own = orders.filter(order => {
		const placed = new Date(order.createdAt);
		return placed >= month.start && (!end || placed < end);
	});
	const ownOffline = offline.filter(sale => sale.date.startsWith(month.key));
	let items = 0;
	let profit = 0;
	for (const order of own) {
		items += order.offers.reduce((sum, { variant }) => sum + variant.quantity, 0);
		profit += orderProfit(order);
	}
	for (const sale of ownOffline) {
		items += sale.items;
		profit += sale.items * (sale.price - sale.cost);
	}
	return { ...month, orders: own.length, offline: ownOffline.length, items, profit: Math.round(profit * 100) / 100 };
}

// Euros per unit of the shop currency, and reais per euro for what the shelter receives.
async function getRates(currency, published) {
	try {
		const symbols = ['EUR', 'BRL'].filter(symbol => symbol !== currency);
		const body = await getJson(`${RATES}?base=${currency}&symbols=${symbols.join(',')}`);
		const rates = { ...body.rates, [currency]: 1 };
		return { eur: rates.EUR, brlPerEur: Math.round(rates.BRL / rates.EUR * 10000) / 10000 };
	} catch (err) {
		if (published?.currency === currency && published.rate && published.brl_per_eur) {
			console.warn(`Exchange rates unavailable, reusing the previous ones: ${err.message}`);
			return { eur: published.rate, brlPerEur: published.brl_per_eur };
		}
		throw err;
	}
}

const thisMonth = currentMonth(new Date());
const lastMonth = monthBefore(thisMonth);
const orders = (await ordersSince(lastMonth.start)).filter(order =>
	order.status !== 'CANCELLED' &&
	(order.source?.type ?? 'ORDER') === 'ORDER');
const offline = await offlineSales();
const current = monthTotals(thisMonth, null, orders, offline);
const previous = monthTotals(lastMonth, thisMonth.start, orders, offline);

// Keep last month's final result on the bar until this month has a sale, unless last month had none either.
const shown = current.items > 0 || previous.items === 0 ? current : previous;
const final = shown !== current;

const published = await readFile(OUT, 'utf8').then(JSON.parse).catch(() => null);
const currency = orders[0]?.amounts.total.currency ?? published?.currency ?? 'USD';
for (const month of [previous, current]) {
	console.log(`${month.label}: ${month.orders} orders, ${month.offline} offline sales, ${month.items} items, ${month.profit} ${currency}`);
}

// Only rewrite the file for a different month or total or a missing rate, so rate changes alone never cause a commit.
if (published?.month === shown.key && published.final === final && published.items === shown.items &&
	published.profit === shown.profit && published.currency === currency && published.rate && published.brl_per_eur) {
	console.log(`Showing ${shown.label}, unchanged`);
} else {
	const { eur, brlPerEur } = await getRates(currency, published);
	const result = {
		month: shown.key,
		label: shown.label,
		final,
		items: shown.items,
		profit_eur: Math.round(shown.profit * eur * 100) / 100,
		goal_eur: GOAL_EUR,
		brl_per_eur: brlPerEur,
		profit: shown.profit,
		currency,
		rate: eur,
	};
	await mkdir(dirname(OUT), { recursive: true });
	await writeFile(OUT, JSON.stringify(result, null, 2) + '\n');
	console.log(`Showing ${shown.label}${final ? ' (final)' : ' so far'} = €${result.profit_eur}`);
}
