const request = require("request");
const dataUrl = 'http://armstrongfluidtechnology.com/Data/ServiceableRegions';

function getData() {
    return new Promise((resolve, reject) => {
        request.get(dataUrl)
            .on('response', function (response) {
                console.log(response.statusCode) // 200
                if (response.statusCode == 200) {
                    resolve(response.data);
                }
                resolve([]);
            })
            .on("error", function (err) {
                resolve([]);
            })
    });
}

const regions = getData();

module.exports = { regions }
