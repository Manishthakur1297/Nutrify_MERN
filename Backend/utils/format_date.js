
const formatDate = (d) => {
    var month = d.getMonth();
    var day = d.getDate().toString();
    var year = d.getFullYear();

    year = year.toString().substr(-2);

    month = (month + 1).toString();

    if (month.length === 1)
    {
        month = "0" + month;
    }

    if (day.length === 1)
    {
        day = "0" + day;
    }

    return day + month + year;
}

module.exports = formatDate