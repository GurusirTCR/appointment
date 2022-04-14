const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const url = require('url');
const { Client } = require("pg");
const { memoryStorage } = require("multer");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
const port = process.env.port || 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + "/public"));
 
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("doctor");
});
const client = new Client({ 
  host: "localhost",
  port: "5432",
  user: "postgres",
  password: "1234",
  database: "Doctor",
});
client.connect();

app.post("/", (req, res) => {
  const date = req.body.date;
  const start = req.body.start_time;
  const end = req.body.end_time;
  const duration = req.body.duration;
  console.log(
    `Date :${date}, Start :${start}, End :${end} Duration :${duration}`
  );
  
  client.query(
    "insert into doctor(date,start_time,end_time,duration)values($1,$2,$3,$4)",
    [date, start, end, duration], 
    (err, result) => { 
      if (!err) {
        console.log("data Is Added");
      }  
      client.end();
    }  
  ); 
  
  res.render("doctor");
}); 
 

app.get("/slot", (req, res) => {
  
  const dataId={
    t : 0
  };

  client.query("select * from doctor", (err, result) => {
    if (!err) {
      for (var row of result.rows) { 
        dataId.t++;
      }
    } 
    console.log(dataId.t);
    console.log("-----------------")
  console.log(req.body)

    res.render("slot",{dataId});
  })  
   
});

app.get('/demo',(req,res) =>{
  const data = {
    id: "",
    d: 0,
    s: "0", 
    e: "0",
    date: "",
};
const demo3 =url.parse(req.url,true).query;
  var v1 = demo3.id_input;
  client.query("select * from doctor where id=$1", [v1], (err, result) => {
    if (!err) {
        for (var row of result.rows) {
        data.id = row.id;
        data.s = row.start_time; 
        data.e = row.end_time;
        data.date = row.date; 
        data.d = row.duration;
      }
    }
    console.log(data); 
    var data1 = generateTimeslots(data.d, data.s, data.e);
    console.log(data1); 
    
res.send({data,data1});
})

app.get('/color',(req,res)=>{
  const demo4 =url.parse(req.url,true).query;
  console.log("-----------Color---------------");
  console.log(demo4.color);
});




//-------------------------------
function generateTimeslots(timeInterval, startTime, endTime) {
  // get the total minutes between the start and end times.
  var totalMins = subtractTimes(startTime, endTime);

  // set the initial timeSlots array to just the start time
  var timeSlots = [startTime];

  // get the rest of the time slots.
  return getTimeSlots(timeInterval, totalMins, timeSlots);
}
function getTimeSlots(timeInterval, totalMins, timeSlots) {
  // base case - there are still more minutes
  if (totalMins - timeInterval >= 0) {
    // get the previous time slot to add interval to
    var prevTimeSlot = timeSlots[timeSlots.length - 1];
    // add timeInterval to previousTimeSlot to get nextTimeSlot
    var nextTimeSlot = addMinsToTime(timeInterval, prevTimeSlot);
    timeSlots.push(nextTimeSlot);

    // update totalMins
    totalMins -= timeInterval;

    // get next time slot
    return getTimeSlots(timeInterval, totalMins, timeSlots);
  } else {
    // all done!
    return timeSlots;
  }
}
function subtractTimes(t2, t1) {
  // get each time's hour and min values
  var [t1Hrs, t1Mins] = getHoursAndMinsFromTime(t1);
  var [t2Hrs, t2Mins] = getHoursAndMinsFromTime(t2);

  // time arithmetic (subtraction)
  if (t1Mins < t2Mins) {
    t1Hrs--;
    t1Mins += 60;
  }
  var mins = t1Mins - t2Mins;
  var hrs = t1Hrs - t2Hrs;

  // this handles scenarios where the startTime > endTime
  if (hrs < 0) {
    hrs += 24;
  }

  return hrs * 60 + mins;
}

function getHoursAndMinsFromTime(time) {
  return time.split(":").map(function (str) {
    return parseInt(str);
  });
}
function addMinsToTime(mins, time) {
  // get the times hour and min value
  var [timeHrs, timeMins] = getHoursAndMinsFromTime(time);

  // time arithmetic (addition)
  if (timeMins + mins >= 60) {
    var addedHrs = parseInt((timeMins + mins) / 60);
    timeMins = (timeMins + mins) % 60;
    if (timeHrs + addedHrs > 23) {
      timeHrs = (timeHrs + addedHrs) % 24;
    } else {
      timeHrs += addedHrs;
    }
  } else {
    timeMins += mins;
  }

  // make sure the time slots are padded correctly
  return (
    String("00" + timeHrs).slice(-2) + ":" + String("00" + timeMins).slice(-2)
  );
}

//-------------------------------
})
app.listen(port, () => {
  console.log(`Server is renning at Port ${port}`);
});
