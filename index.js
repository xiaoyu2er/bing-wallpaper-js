const fetch = require("node-fetch");
const fs = require("fs");

const BING_API =
  "https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=10&nc=1612409408851&pid=hp&FORM=BEHPTB&uhd=1&uhdwidth=3840&uhdheight=2160";

const BING_URL = "https://cn.bing.com";

function isDate(date) {
  return Object.prototype.toString.call(date) == "[object Date]";
}

function parseDate(date) {
  if (!isDate(date)) {
    date = new Date(date);
  }
  const year = date.getFullYear();
  const month = ("" + (date.getMonth() + 1)).padStart(2, "0");
  const day = ("" + date.getDate()).padStart(2, "0");
  const hours = ("" + date.getHours()).padStart(2, "0");
  const minutes = ("" + date.getMinutes()).padStart(2, "0");
  const seconds = ("" + date.getSeconds()).padStart(2, "0");

  return {
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
  };
}

function formatDate(date) {
  const { year, month, day, hours, minutes, seconds } = parseDate(date);
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getImageUrl(url, w, h) {
  var newUrl = url;
  if (url.indexOf(BING_URL) == -1) {
    newUrl = `${BING_URL}${url}`;
  }

  var index = newUrl.indexOf("&");
  if (index > -1) {
    newUrl = newUrl.substr(0, index);
  }

  if (w || h) {
    newUrl += `&pid=hp&rs=1&c=4`;
  }
  if (w) {
    newUrl += `&w=${w}`;
  }
  if (h) {
    newUrl += `&h=${h}`;
  }

  return newUrl;
}

function imageToMarkdown(image, w, h) {
  var url1 = getImageUrl(image.url, w, h);
  var url2 = getImageUrl(image.url);

  var markdown = `![](${url1} "${image.copyright}")[${image.startdate}](${url2})`;

  return markdown;
}

function getLocalImages() {
  var readme = fs.readFileSync("./README.md").toString();
  var images = [];

  //   var regex = /(\d{4}-\d{2}-\d{2})\s\|\s\[(.+?)\]\((https?:\/\/[a-zA-Z\./0-9_?=-]+)\)/g;
  //   //   [2021-07-08](https://cn.bing.com/th?id=OHR.LakeUrmia_EN-US4986086287_UHD.jpg "a title")
  //   do {
  //     var result = regex.exec(readme);
  //     if (result) {
  //       var startdate = result[1];
  //       var copyright = result[2];
  //       var url = result[3];

  //       images.push({
  //         startdate: startdate,
  //         url: getImageUrl(url),
  //         copyright,
  //       });
  //     }
  //   } while (result);

  // ![](https://cn.bing.com/th?id=OHR.AppalachianTrail_ZH-CN5076145300_UHD.jpg&pid=hp&rs=1&c=4&w=384 "")[2021-07-07]
  var regex2 = /\((https?:\/\/[a-zA-Z\./0-9_?&=-]+)\s+"(.+?)"\)\[(\d{4}-\d{2}-\d{2})\]/g;
  do {
    var result = regex2.exec(readme);
    if (result) {
      var url = result[1];
      var copyright = result[2];
      var startdate = result[3];

      if (!images.find((i) => i.url == getImageUrl(url))) {
        images.push({
          startdate: startdate,
          url: getImageUrl(url),
          copyright,
        });
      }
    }
  } while (result);

  return images;
}

async function main() {
  const res = await fetch(BING_API);
  const data = await res.json();

  const images = data.images
    .map(({ startdate, url, copyright }) => {
      return {
        startdate: startdate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
        url: getImageUrl(url),
        copyright,
      };
    })
    .reverse();

  let localImages = getLocalImages();

  console.log(localImages);
  console.log("---------");
  console.log(images);

  for (var i = 0; i < images.length; i++) {
    if (!localImages.find((img) => img.url == images[i].url)) {
      localImages.unshift(images[i]);
    }
  }

  localImages = localImages.sort((a, b) => {
    return parseFloat(b.startdate.replace("-", "")) - parseFloat(a.startdate.replace("-", ""));
  });
  console.log("---------");
  console.log(localImages);

  writeToLocal(localImages);
}

function writeToLocal(images) {
  var content = `## Bing Wallpaper\n\n`;
  if (images[0]) {
    var img = imageToMarkdown(images[0], 1000);
    content += img;

    content += `\n\n更新于 ${formatDate(new Date())}\n`;
  }

  if (images[1]) {
    content += `
|      |      |      |
| :----: | :----: | :----: |`;
  }

  for (var i = 0; i < images.length; i++) {
    var str = imageToMarkdown(images[i], 384);
    // console.log(images[i], str);
    if (i % 3 == 0) {
      content += "\n|" + str + "|";
    } else {
      content += str + "|";
    }
  }

  fs.writeFileSync("./README.md", content);
}

main();
