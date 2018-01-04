"use strict";
const https = require("https");
const util = require("util");
const sprintf = require("sprintf-js").sprintf;

const currencies = new Set(["BTC", "EOS", "XLM", "XVG", "ZRX"]);
const frequency = 3; // secs

let timeout;

process.stdout.write("\tPrice (USD)\t\t% Change (1h)\t\t% Change (24h)\n");

const displayCurrenciesStats = (queriedCurrencyList) => {
    let currenciesStats = "";
    for (const c of queriedCurrencyList) {
        if (currencies.has(c["symbol"])) {
            const down1h = c["percent_change_1h"][0] === '-';
            const down24h = c["percent_change_24h"][0] === "-";
            currenciesStats += sprintf(`${down1h ? '\x1b[31m' : '\x1b[32m'}%s\t${down1h ? '\x1b[31m' : '\x1b[32m'}%10.3f\t\t${down1h ? '\x1b[31m' : '\x1b[32m'}%8.2f\t\t${down24h ? '\x1b[31m' : '\x1b[32m'}%8.2f\n`, c["symbol"], c["price_usd"], c["percent_change_1h"], c["percent_change_24h"]);
        }
    }

    process.stdout.write(currenciesStats);
    // process.stdout.clearLine();
    process.stdout.moveCursor(0, -currencies.size);
}

const getStats = () => {
    https.get("https://api.coinmarketcap.com/v1/ticker/", (res)=> {
        const { statusCode } = res;
        const contentType = res.headers["content-type"];

        if (statusCode !== 200) {
            process.stderr.write("Request errors...\n");
            return ;
        }

        res.setEncoding("utf8");
        let rawData = "";

        res.on("data", (chunk) => {
            rawData += chunk;
        });

        res.on("end", () => {
            try {
                const currencyList = JSON.parse(rawData);
                displayCurrenciesStats(currencyList);

                timeout = setTimeout(() => {
                    getStats();
                }, frequency * 1000);
            } catch (err) {
                console.error(err.message);
            }
        });
    });
}

getStats();

process.on("SIGINT", () => {
    process.stdout.moveCursor(0, currencies.size);
    process.stdout.write("process interruptted...\n");
    clearTimeout(timeout);
});
