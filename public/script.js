
async function fetchExchangeRates() {
    try {
        const response = await fetch(`/api/convert?amount=1&base=USD&to=CNY,JPY,EUR,GBP,AUD,CAD,CHF,INR,BRL,RUB`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();

        const exchangeRateList = document.getElementById('exchangeRateList');
        if (!exchangeRateList) {
            throw new Error('Exchange rate list element not found');
        }

        exchangeRateList.innerHTML = '';

        const ratesContainer = document.createElement('div');
        ratesContainer.className = 'rates-container';

        const usdItem = document.createElement('div');
        usdItem.className = 'exchange-rate-item usd-item';
        usdItem.textContent = `USD: 1.00`;
        ratesContainer.appendChild(usdItem);

        const rates = data.data; 
        console.log('Rates:', rates); 

        if (!rates) {
            throw new Error('No rates found in the response');
        }

        for (const currency of ['CNY', 'JPY', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'INR', 'BRL', 'RUB']) {
            const rateStr = rates[currency]; 
            const rate = parseFloat(rateStr); 
            
            if (!isNaN(rate)) {
                const item = document.createElement('div');
                item.className = 'exchange-rate-item';
                item.textContent = `${currency}: ${rate.toFixed(2)}`; 
                ratesContainer.appendChild(item);
            } else {
                console.warn(`Rate for ${currency} not found or is not a number:`, rateStr);
            }
        }

        exchangeRateList.appendChild(ratesContainer);
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchExchangeRates();
});

async function convertCurrency(amount, baseCurrency, toCurrency) {
    const response = await fetch(`/api/convert?amount=${amount}&base=${baseCurrency}&to=${toCurrency}`);
    const data = await response.json();

    if (!data.data || !data.data[toCurrency]) {
        throw new Error(`Unable to find rate for ${toCurrency}`);
    }

    
    const rate = parseFloat(data.data[toCurrency]); 
    if (!isNaN(rate)) {
        return (rate * amount).toFixed(2); 
    } else {
        throw new Error(`Expected a number for currency ${toCurrency}, but got ${data.data[toCurrency]}`);
    }
}

async function fetchHistoricalRates(baseCurrency, toCurrency, dateRange) {
    const todayValue = document.getElementById('historicalDate').value; 
    const requests = [];

    try {
        if (!todayValue) {
            throw new Error('Please select a date.');
        }

        const todayDate = new Date(todayValue); 
        
        if (isNaN(todayDate.getTime())) {
            throw new Error('Invalid date selected. Please use the format yyyy/mm/dd.');
        }

        if (dateRange === 'weekly') {
            for (let i = 0; i < 7; i++) {
                const date = new Date(todayDate);
                date.setDate(todayDate.getDate() - i);
                const formattedDate = date.toISOString().split('T')[0];

                console.log(`Requesting data for date: ${formattedDate}`);
                requests.push(fetch(`/api/historical?date=${formattedDate}&base=${baseCurrency}&to=${toCurrency}`));
            }
        } else if (dateRange === 'yearly') {
            for (let i = 0; i < 12; i++) {
                const date = new Date(todayDate);
                date.setMonth(todayDate.getMonth() - i);
                date.setDate(1); 
                const formattedDate = date.toISOString().split('T')[0];

                requests.push(fetch(`/api/historical?date=${formattedDate}&base=${baseCurrency}&to=${toCurrency}`));
            }
        }

        const responses = await Promise.all(requests);
        const rates = {};

        for (const response of responses) {
            if (!response.ok) { 
                const errorMessage = await response.text(); 
                console.warn(`Error fetching data: ${response.status} - ${errorMessage}`);
                continue; 
            }

            const data = await response.json();
            

            
            for (const date in data) {
                if (data[date] && data[date][toCurrency]) {
                    rates[date] = data[date][toCurrency];
                } else {
                    console.warn(`No data for ${date} or currency ${toCurrency}`);
                }
            }
        }

        
        return rates;

    } catch (error) {
        console.error('Error fetching historical rates:', error);
        throw new Error('Failed to fetch historical rates: ' + error.message);
    }
}

document.getElementById("convertButton").onclick = async () => {
    const amount = document.getElementById('amount').value;
    const baseCurrency = document.getElementById('fromCurrency').value.toUpperCase();
    const toCurrency = document.getElementById('toCurrency').value.toUpperCase();

    try {
        const result = await convertCurrency(amount, baseCurrency, toCurrency);
        document.getElementById('result').innerText = `Result: ${result}`;
    } catch (error) {
        alert(error.message);
    }
};

document.getElementById("fetchHistoricalButton").onclick = async () => {
    const baseCurrency = document.getElementById('fromCurrency').value.toUpperCase();
    const toCurrency = document.getElementById('toCurrency').value.toUpperCase();
    const dateRange = document.getElementById('timeFrame').value;

    try {
        const historicalRates = await fetchHistoricalRates(baseCurrency, toCurrency, dateRange);
        updateChart(historicalRates, toCurrency, dateRange);
    } catch (error) {
        alert(error.message);
    }
};

let historicalChart; 

function updateChart(historicalRates, toCurrency, dateRange) {
    const chartCtx = document.getElementById('historicalChart').getContext('2d');

    const labels = Object.keys(historicalRates).reverse(); 
    const data = labels.map(date => historicalRates[date]).reverse(); 

    const chartData = {
        labels: labels,
        datasets: [{
            label: `${toCurrency} Historical Rates`,
            data: data,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            fill: false
        }]
    };

    
    if (historicalChart) {
        historicalChart.data = chartData; 
        historicalChart.update(); 
    } else {
        historicalChart = new Chart(chartCtx, {
            type: 'line',
            data: chartData,
            options: { 
                responsive: false, 
                maintainAspectRatio: true, 
                scales: { 
                    y: { 
                        beginAtZero: true 
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        },
                        ticks: {
                            autoSkip: false, 
                            maxRotation: 0, 
                            minRotation: 0  
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Exchange Rate'
                        }
                    }
                }
            }
        });
    }
}