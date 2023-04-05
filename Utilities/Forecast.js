
    const getForecast = (data) => {
        let bestAlpha = 0.0;
        let bestMAE = 0.0;
        const numOfForecast = 2;
        for (let alpha = 0.1; alpha <= 1.0; alpha += 0.1) {
            let forecastValues = forecastOne(data, alpha, 1);
            let mae = calculateMae(data, forecastValues);
            if (mae < bestMAE) {
                bestMAE = mae;
                bestAlpha = alpha;
            }
        }
        let finalForecast = forecastOne(data, bestAlpha, numOfForecast);
        const forecastedData = finalForecast[finalForecast.length -1 ];
        console.log(finalForecast)
        return forecastedData;
    }


    const forecastOne = (data, alpha, numOfForecast) => {
        let n = data.length;
        let forecastResult = [];

        forecastResult[0] = data[0];
        //get Previous Data
        for (let index = 1; index < n; index++) {
           forecastResult.push({
                date: data[index].date,
                score: alpha * data[index].score + (1 - alpha) * data[index-1].score
           })
        }
        //Forecasting
        for (let index = n; index < n + numOfForecast; index++) {
            forecastResult.push({
                date: "Forecast",
                score: alpha * forecastResult[index-1].score + (1 - alpha) * data[index-n].score
           })
   
        }
        return forecastResult;
    }
    //Calculate an error san forecast para maImprove pa an future forecast
    const calculateMae = (original, forecast) => {
        let sum = 0.0;

        for (let index = 0; index < original.length; index++) {
            sum += Math.abs(original[index].score - forecast[index].score)           
        }
        return sum;
    }
    
exports.getForecast = getForecast;