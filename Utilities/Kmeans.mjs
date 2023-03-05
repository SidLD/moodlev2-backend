export class kClass{
    constructor(){
        let k = 3;
        let clusterPoints = [];
    }

    setClusterNumber = (param) => {k = param}

    //ex data = (1<an score san student>, 1< tos kun nanu na data na sa tingin tah significance sa score like age>)
    initClusterPoint = (data) => {
        for(var i = 0; i < this.k; i++){
            clusterPoints.push(Math.random(data.length))
        }
        return clusterPoints;
    }

    euclideanDistance = (pointA, clusterPoints) => {  
        var sum = 0;
        for (let i = 0; i < clusterPoints.length; i++) {
        sum += Math.pow(pointA[i] - clusterPoints[i], 2);
        }
        return Math.sqrt(sum);
    }

    assignDataToClusterPoints = (data) => {
        let assignments = [];
        for (let i = 0; i < data.length; i++) {
            let distances = [];
            for (let j = 0; j < clusterPoints.length; j++) {
            distances.push(euclideanDistance(data[i], centroids[j]));
            }
            let closestCentroidIndex = distances.indexOf(Math.min(...distances));
            assignments.push(closestCentroidIndex);
        }
        return assignments;
    }


    updateClusterPoints = (data, assignments, clusterPoints) => {
        let newClusterPoints = [];
        for (let i = 0; i < clusterPoints; i++) {
            //ig filter tah an data 
            let clusterPointsTemp = data.filter((point, index) => assignments[index] === i)
            if (clusterPoints.length === 0) {
                // If a centroid has no assigned points, leave it in place
                newClusterPoints.push(centroids[i]);
            } else {
                // Calculate the mean of the points in the cluster
                let newClusterPoint = clusterPoints[0].map((value, index) => {
                return clusterPoints.reduce((sum, point) => sum + point[index], 0) / clusterPointsTemp.length;
                });
                newClusterPoints.push(newClusterPoint);
            }
        }
        return newClusterPoints
    }

    run = () => {
        let assignments = assignDataToClusterPoints(data, clusterPoints);
        clusterPoints = updateClusterPoints(data, assignments, k);
    }

}