var unirest= require('unirest');
var mysql = require('mysql'); //var fs = require('fs');
var sleep = require('await-sleep');
//const process = require('process'); 

var lowestprice ='undefined'
async function trackflights(flightdata) {
	console.log(flightdata);

    if (flightdata.trackingEnd < 1) {
        flightdata.trackingEnd = 7*24*4;
    }
    else {
        flightdata.trackingEnd = flightdata.trackingEnd*24*4;
    }
    var i = 0, iterations = flightdata.trackingEnd;
    for (i = 0; i < iterations; i++) { 
        kiwirequest(flightdata.token,flightdata.flyto,flightdata.flyfrom,formatDate(flightdata.dDate),formatDate(flightdata.rDate));
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
var con = mysql.createConnection({
  socketPath: '/cloudsql/'+process.env.INSTANCE_CONNECTION_NAME, //"/cloudsql/spry-chassis-249615:us-central1:my-flight-data;dbname=Tracked_Flights",
  user: "read_only",
  password: "ifp6MtJ!Giwjmp7",
  database: "Tracked_Flights"
});

function kiwirequest(token,flyto,flyfrom,ddate,rdate,flightType) {
    //range of dates
    date1 = '10/10/2019'
    date2 = '24/10/2019'
    var addData = 'unknown'
    var time =new Date().toISOString().slice(0, 19).replace('T', ' ');
//.toISOString()//.match(/(\d{2}:){2}\d{2}/)[0]

      //need to add to this table first so that foreign key is valid (will need additional SQL to update if tracking fails
    if(currentprice === 200) {
	    var sql = "INSERT INTO tracking (token,username,tracking_length,submission_time,route) VALUES ("+token+",'tarik_akyuz',3,'"+time+"','"+flyfrom+"_"+flyto+"')";
	    console.log(sql);
	    con.query(sql, function (err, result) {
               if (err) throw err;
               console.log("1 record inserted");
	    });
    }
    
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
       /* const path = './data/'+flyfrom+'-'+flyto+'.csv'

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
        } */
     
        flightType = response.body.data[0].duration.return;
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
        var atime_from = response.body.data[0].atime_from+"";
        if(atime_from == 'undefined') {
            atime_from = 'NULL';
        }
        var operating_carrier = response.body.data[0].route[0].operating_carrier;
        if(operating_carrier == '') {
            operating_carrier = 'NULL';
        }
          var sql = "INSERT INTO flights (token, flyFrom, flyTo, Lowest_Price_Found, Time_Collected, Flight_Date, OW_RT, connections, flight_time_total, a_time_to, duration_to, a_time_from, duration_from, carrier) VALUES ("+token+",'"+flyfrom+"','"+flyto+"',"+response.body.data[0].price+",'"+time+"','"+(new Date(response.body.data[0].aTimeUTC)).toISOString().slice(0,19).replace('T',' ')+"','"+flightType+"','"+connections+"','"+response.body.data[0].fly_duration+"','"+(new Date(response.body.data[0].aTimeUTC)).toISOString().slice(0,19).replace('T',' ')+"',"+response.body.data[0].duration.departure+","+atime_from+","+response.body.data[0].duration.return+",'"+operating_carrier+"')";
        console.log(sql);
          con.query(sql, function (err, result) {
              if (err) throw err
              console.log('sql flights table updates');
          });
     /*
        fs.appendFile(path, '\n'+flyfrom+','+flyto+','+response.body.data[0].price+','+time+','+flightType+','+connections+','+response.body.data[0].fly_duration+','+response.body.data[0].aTimeUTC+','+response.body.data[0].duration.departure+','+response.body.data[0].atime_from+','+response.body.data[0].duration.return+','+response.body.data[0].route[0].operating_carrier+','+'token', (err) => {
            //token --response.body.data[0].booking_token
            if (err) throw err; 
        }); */
   
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
