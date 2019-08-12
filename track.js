var unirest= require('unirest');
var fs = require('fs');
var sleep = require('await-sleep');
 
var lowestprice ='undefined'
async function trackflights(flightdata) {
    if (flightdata.trackingEnd < 1) {
        flightdata.trackingEnd = 7*24*4;
    }
    else {
        flightdata.trackingEnd = flightdata.trackingEnd*24*4;
    }
    var i = 0, iterations = flightdata.trackingEnd;
    for (i = 0; i < iterations; i++) { 
        kiwirequest(flightdata.flyto,flightdata.flyfrom,formatDate(flightdata.dDate),formatDate(flightdata.rDate));
        await sleep(15*60*1000);
    }
   return lowestprice;
}

// receive message from master process
process.on('message', async (message) => {
  const lowestPrice = await trackflights(message); 
  
  // send response to master process
  process.send({ price: lowestPrice });
});

var currentprice = 200;
function kiwirequest(flyto,flyfrom,ddate,rdate,flightType) {
    //range of dates
    date1 = '18/8/2019'
    date2 = '24/8/2019'
    var addData = 'unknown'
    unirest.get('https://api.skypicker.com/flights?flyFrom='+flyfrom+'&to='+flyto+'&dateFrom='+date1+'&dateTo='+date2+'&partner=picky')
.end(function (response) {
        if (currentprice == "") {currentprice = response.body.data[0].price};
        var logoutput = "Lowest price from "+flyfrom+" to "+flyto+" is "+response.body.data[0].price
        if (response.body.data[0].price < currentprice) {
            console.log(logoutput+" \x1b[31m(-"+(currentprice-response.body.data[0].price)+")\x1b[37m");
        } else {
         console.log(logoutput+"(+"+(response.body.data[0].price-currentprice)+")");
         }
        currentprice = response.body.data[0].price;
        const path = './data/'+flyfrom+'-'+flyto+'.csv'

        if (addData == 'unknown') {
            try {
              if (fs.existsSync(path)) {
                addData = 'append'
              }
              if (addData == 'unknown') {
                addData = 'append'
                fs.writeFile(path, 'flyFrom,flyTo,Lowest Price Found,Time collected,Date found,OW_RT, layovers, flight time, atime_to, duration_to, atime_from, duration_from, carrier, token',                 (err) => {
                    // throws an error, you could also catch it here
                    if (err) throw err;

                    // success case, the file was saved
                    console.log('Created new file');
                });
              }
                
            } catch(err) {
             
            }
        } 
        flightType = response.body.data[0].duration.return;
        var time =new Date().toISOString()//.match(/(\d{2}:){2}\d{2}/)[0]
        //check connections
        var numConnections = response.body.data[0].route.length
        var connections = '{'
        if (numConnections == 0) {
            connections = '{direct}'
        } else {
            for(var i = 1; i < numConnections; i++) {
                connections = connections + response.body.data[0].route[i-1].cityTo +','
            }
            connections = connections+'}';
        }
        fs.appendFile(path, '\n'+flyfrom+','+flyto+','+response.body.data[0].price+','+time+','+flightType+','+connections+','+response.body.data[0].fly_duration+','+response.body.data[0].aTimeUTC+','+response.body.data[0].duration.departure+','+response.body.data[0].atime_from+','+response.body.data[0].duration.return+','+response.body.data[0].route[0].operating_carrier+','+'token', (err) => {
            //token --response.body.data[0].booking_token
            if (err) throw err;
        }); 
    });
}

function formatDate (input) {
    if (input != '') {
      var datePart = input.match(/\d+/g),
      year = datePart[0].substring(2), // get only two digits
      month = datePart[1], day = datePart[2];

      return day+'/'+month+'/'+year;
    } return 0;
}
