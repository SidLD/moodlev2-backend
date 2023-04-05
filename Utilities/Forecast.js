const { forecast } = require("../controllers/forecastController");

class TimeSeires{

    /**
     * 
     * data = [
     *      {
     *          score,
     *          time
     *      }
     * ]
     *  
     * alpha is an pagWeight san pprevious na data, kun gaano sira makakaApekto sa future
     * MAE or Mean Abosute Error is para igCalculate kun pira an error san previous prediction sa actual na guinPredict
     * 
     */
    forecast = (data) => {
        let bestAlpha = 0.0;
        let bestMAE = 0.0;
        for (let alpha = 0.1; alpha <= 1.0; alpha += 0.1) {
            let forecastValues = forecast(data, alpha, 1);
            let mae = calculateMAE(data, forecastValues);
            if (mae < bestMAE) {
                bestMAE = mae;
                bestAlpha = alpha;
            }
        }
        let finalForecast = forecast(original, bestAlpha, 2);
        const forecastedData = finalForecast[finalForecast.length -1 ];
        
        return forecastedData;
    }


    movingAverage = (data, windowSize) => {
        //WindowSize is kun pira na lap sa iya previous na data
        let result = [];
        for (let index = 0; index < data.length + windowSize; index++) {
            result.push({
                score: data[index].score,
                date: data[index].date
            })

            if(index > windowSize-1){
                let sum = 0.0;
               for (let j = 0; j < i-windowSize+1; j++) {
                    sum += data[j].score;
                }
                result[index].score = sum/windowSize
            }
            
        }
    }

    forecastOne = (data, alpha, numOfForecast) => {
        let n = data.length;
        let forecastResult = [];
        for (let index = 1; index < n; index++) {
           forecastResult.push({
                date: data[index].date,
                score: alpha * data[index].score + (1 - alpha) * data[index-1].score
           })
        }
        for (let index = n; index < n + numOfForecast; index++) {
            forecastResult.push({
                date: data[index].date,
                score: alpha * forecastResult[index-1].score + (1 - alpha) * data[index-n].score
           })
   
        }
    }
    //Calculate an error san forecast para maImprove pa an future forecast
    calculateMae = (original, forecast) => {
        let sum = 0.0;

        for (let index = 0; index < original.length; index++) {
            sum += Math.abs(original[index].score - forecast[index].score)           
        }
        return sum;
    }
}