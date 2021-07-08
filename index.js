const fetch = require("node-fetch");
const fs = require("fs");

const BING_API =
  "https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=10&nc=1612409408851&pid=hp&FORM=BEHPTB&uhd=1&uhdwidth=3840&uhdheight=2160";

const BING_URL = "https://cn.bing.com";

var data = {
  images: [
    {
      startdate: "20210708",
      fullstartdate: "202107080700",
      enddate: "20210709",
      url: "/th?id=OHR.AppalachianTrail_EN-CN8362484386_UHD.jpg&rf=LaDigue_UHD.jpg&pid=hp&w=3840&h=2160&rs=1&c=4",
      urlbase: "/th?id=OHR.AppalachianTrail_EN-CN8362484386",
      copyright: "The Appalachian Trail in Stokes State Forest, New Jersey (© Frank DeBonis/Getty Images)",
      copyrightlink: "/search?q=appalachian+trail&form=hpcapt&filters=HpDate%3a%2220210708_0700%22",
      title: "A storied trail marks a century",
      caption: "A storied trail marks a century",
      copyrightonly: "© Frank DeBonis/Getty Images",
      desc: "This is but a tiny portion of what's often called the longest hiking-only trail in the world. Today we're in Stokes State Forest along the top edge of New Jersey and those tell-tale two-by-six-inch white blazes tell us that we're on the famous Appalachian Trail (the 'AT' to those in the know). And what a day to be here, for July 8, 2021, is the trail's 100th birthday.",
      date: "Jul 8, 2021",
      bsTitle: "A storied trail marks a century",
      quiz: "/search?q=Bing+homepage+quiz&filters=WQOskey:%22HPQuiz_20210708_AppalachianTrail%22&FORM=HPQUIZ",
      wp: true,
      hsh: "f80d565cd0ab5776cd91e2caa3d88531",
      drk: 1,
      top: 1,
      bot: 1,
      hs: [],
    },
    {
      startdate: "20210707",
      fullstartdate: "202107070700",
      enddate: "20210708",
      url: "/th?id=OHR.LakeUrmia_EN-CN7400808402_UHD.jpg&rf=LaDigue_UHD.jpg&pid=hp&w=3840&h=2160&rs=1&c=4",
      urlbase: "/th?id=OHR.LakeUrmia_EN-CN7400808402",
      copyright: "Kazem Dashi rock formation in Lake Urmia, Iran (© Ali/Adobe Stock)",
      copyrightlink: "/search?q=lake+urmia&form=hpcapt&filters=HpDate%3a%2220210707_0700%22",
      title: "Back on the rise",
      caption: "Back on the rise",
      copyrightonly: "© Ali/Adobe Stock",
      desc: "This beautiful lake in northwestern Iran has had a rough couple of decades. Until around 1995, Lake Urmia was one of the top-ten largest saltwater lakes on Earth, and the center of a thriving resort scene. Then drought, rising temperatures, water overuse, and the building of a causeway across the lake reduced it to less than 10% of its size by the 2010s.",
      date: "Jul 7, 2021",
      bsTitle: "Back on the rise",
      quiz: "/search?q=Bing+homepage+quiz&filters=WQOskey:%22HPQuiz_20210707_LakeUrmia%22&FORM=HPQUIZ",
      wp: true,
      hsh: "d5fc9ce6fe50ec78164d26ccd9d5e53a",
      drk: 1,
      top: 1,
      bot: 1,
      hs: [],
    },
  ],
};

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
  var regex = /(\d{4}-\d{2}-\d{2})\s\|\s\[(.+?)\]\((https?:\/\/[a-zA-Z\./0-9_?=-]+)\)/g;

  var images = [];
  //   [2021-07-08](https://cn.bing.com/th?id=OHR.LakeUrmia_EN-US4986086287_UHD.jpg "a title")
  do {
    var result = regex.exec(readme);
    if (result) {
      var startdate = result[1];
      var copyright = result[2];
      var url = result[3];

      images.push({
        startdate: startdate,
        url,
        copyright,
      });
    }
  } while (result);

  var regex2 = /\[(\d{4}-\d{2}-\d{2})\]\((https?:\/\/[a-zA-Z\./0-9_?=-]+)\s+"(.+?)"\)/g;
  do {
    var result = regex2.exec(readme);
    if (result) {
      var startdate = result[1];
      var url = result[2];
      var copyright = result[3];

      images.push({
        startdate: startdate,
        url,
        copyright,
      });
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

  //   console.log(localImages);
  //   console.log("---------");
  //   console.log(images);

  for (var i = 0; i < images.length; i++) {
    if (!localImages.find((img) => img.url == images[i].url)) {
      localImages.unshift(images[i]);
    }
  }

  localImages = localImages.sort((a, b) => {
    return parseFloat(b.startdate.replace("-", "")) - parseFloat(a.startdate.replace("-", ""));
  });
  //   console.log("---------");
  //   console.log(localImages);

  writeToLocal(localImages);
}

function writeToLocal(images) {
  var content = `## Bing Wallpaper\n\n`;
  if (images[0]) {
    var img = imageToMarkdown(images[0], 1000);
    content += img;

    content += `\n\n更新于 ${new Date().toUTCString()}\n`;
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
