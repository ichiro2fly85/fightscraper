const scrapeController = {};


import fs from 'fs/promises';
import puppeteer from 'puppeteer';
import cron from 'node-cron';
import { create } from 'xmlbuilder2'
import moment from 'moment-timezone';

import Client from 'ssh2-sftp-client';
import xmlParser from 'xml2json';
import Parser from 'rss-parser';

import path from 'path';
import key from '../config.js';
import basedir from '../pathFinder.js';


let rssItemArray = [];
let scheduleObject = {};



scrapeController.init = () => {

  console.log("[INFO]", "(scrapeController)", "APP INITIALIZE \n");

  scrapeController.getSchedules();  


  cron.schedule('0 */6 * * *', () => {
    scrapeController.getSchedules();
  }, {
    scheduled: true,
    timezone: "America/New_York"
  });

};

scrapeController.getSchedules = async () => {

  console.log(moment().tz("America/New_York").format("LLLL"));
  console.log("[INFO]", "(scrapeController)", "CREATING SCHEDULE OBJECT");

  let eventArray = [];

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto("http://fightnights.com/upcoming-boxing-schedule");


  let events = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".event-list li")).map(x => x.textContent);
  });


  await browser.close();


  let uniqueChars = [...new Set(events)];

  const index = uniqueChars.indexOf("  View Fight Night ");
  if (index > -1) {
    uniqueChars.splice(index, 1);
  }


  uniqueChars.forEach((element, i) => {
    let eventObject = {};

    let tempFullString, tempDate, tempVS, tempLoc, tempTime, tempBrod;

    //Gather Date String
    tempFullString = element.split("   ");
    tempDate = tempFullString[0].split(",");
    tempLoc = tempFullString[1];
    tempTime = tempFullString[2] !== "" ? tempFullString[2] : "TBA";
    tempBrod = tempFullString[3];


    tempDate = tempDate[1].split(moment().year().toString());
    tempVS = tempDate[1];

    tempDate = moment(tempDate[0], "MMM Do").format('llll');
    tempDate = tempDate.split("12:00");

    tempBrod = tempBrod.replace("  View Fight Night ", "");



    eventObject.date = tempDate[0].trim();
    eventObject.matchup = tempVS.trim();
    eventObject.location = tempLoc;
    eventObject.time = tempTime;
    eventObject.broadcast = tempBrod;

    eventArray.push(eventObject);


  });

  //console.log(eventArray);

  const fightlist = create({
    encoding: 'utf-8'
  }).ele('fightlist');

  eventArray.forEach((element) => {
    fightlist.ele('item')
      .ele('date').txt(element.date).up()
      .ele('matchup').txt(element.matchup).up()
      .ele('location').txt(element.location).up()
      .ele('time').txt(element.time).up()
      .ele('broadcast').txt(element.broadcast).up()
      .up()
  });


  let xml = fightlist.end({ prettyPrint: true });

   await fs.writeFile("fights.xml", xml);

   scheduleObject = xmlParser.toJson(xml);


  scrapeController.getRss();

};

scrapeController.getRss = async () => {

  console.log("[INFO]", "(scrapeController)", "CREATING RSS OBJECT");

  rssItemArray = [];

  let parser = new Parser({
    customFields: {
      item: [
        ['description', 'description', {keepArray: true}],
        ['media:thumbnail', 'media:thumbnail']
      ]
    }
  });

  let feed = await parser.parseURL('https://boxingjunkie.usatoday.com/feed');



   for (let i = 0; i < feed.items.length; i++) {
    const item = feed.items[i];

     let cacheObject = {};
 
     cacheObject.title = item.title;
 
     if (item.description[0].indexOf('https://www.youtube.com/watch?v=') > -1) {
       let tempDesc = item.description[0];
       let tempslice = tempDesc.slice(tempDesc.indexOf("https://www.youtube.com/watch?v="), -1);
       let tempsplit = tempslice.split(" ")[0];

       let newItemDescription = tempDesc.replace(tempsplit, '')

       cacheObject.description = newItemDescription;
       cacheObject.descURL = tempsplit;
       
     } else {
      cacheObject.description = item.description[0];
     }

     cacheObject.link = item.link;
     cacheObject.image = item['media:thumbnail'].$.url;
     cacheObject.date = moment(item.pubDate).format('LL');
 
     rssItemArray.push(cacheObject);
   }

  

  //console.log(rssItemArray);
  scrapeController.finish();

  return rssItemArray;

}


scrapeController.finish = () => {

  let sftp = new Client();
  let filePath = path.join(basedir, 'fights.xml');

  sftp.connect({
    host: 'dstacks.net',
    port: '22',
    username: 'dh_aqpc98',
    password: key
  }).then(() => {
    return sftp.put(filePath, '/home/dh_aqpc98/dstacks.net/fights.xml');
  }).then(() => {
    return sftp.end();
  }).catch(err => {
    console.log(err, 'catch error');
  });


  console.log("[INFO]", "(scrapeController)", "SUCCESS");
};



scrapeController.getRssJSON = (req, res) => {
  console.log(["INFO", "(scrapeController)", "REQUEST EVENTS LENGTH: " + rssItemArray.length]);

  res.status(200).json({
    success: true,
    data: rssItemArray
  })
}



scrapeController.getEventSchedule = (req, res) => {
  console.log(["INFO", "(scrapeController)", "REQUEST SCHEDULES"]);

  res.status(200).json({
    success: true,
    data: JSON.parse(scheduleObject)
  })

}

export default scrapeController;
