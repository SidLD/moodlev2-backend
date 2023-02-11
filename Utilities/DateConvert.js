const getDate = (data) => {
    let dateTime = data.split('-');
    const dateData = dateTime[0].split('/');
    const timeData = dateTime[1].split('/');

    const date = {
        day:dateData[0],
        month:dateData[1],
        year: dateData[2],
        sec: timeData[0],
        min: timeData[1],
        hour: timeData[2]
    }
    return date;
}

exports.module = getDate;
