const GoogleChartsNode = require('google-charts-node');

const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');

app.use(bodyParser.json());
const defaultChartType = 'PieChart';

app.get('/', async (req, res) => {
  // Renders an example chart
  const image = await GoogleChartsNode.render(drawChart);
  res.header('Content-Type', 'image/png');
  res.send(image);
});

app.post('/', renderCustomChart);

app.post('/customQuery', async (req, res) => {
  console.log(req.body);
  if (req.body.customQuery) {
    req.body.data = req.body.customQuery;
    renderCustomChart(req, res);
  } else {
    console.log('wrong type');
    res.status(400).send('This type of query is not currently supported. ');
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

async function renderCustomChart(req, res) {
  console.log(req.body);

  let data = req.body.data; //data as json array or jsonString
  if (typeof data == 'string') {
    data = JSON.parse(data);
  }
  try {
    data = data.map((element) => [...Object.values(element)]); //json array might contain entries as object. This make sure that they are an array
    if (req.body.clean == false) {
    } else {
      //Recommended. This makes sure that the data can actually be visualized
      data = cleanData(data);
    }
    checkData(data);

    const drawchartString = formatChartString(data, req.body.chartType, req.body.options);

    await GoogleChartsNode.render(drawchartString)
      .then((image) => {
        // console.log(image.buffer);
        // res.header('Content-Type', 'image/png');
        // res.send(image);
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': image.length,
        });
        res.end(image);
      })
      .catch((err) => {
        console.error(err);
        res.status(400).send(err);
      });
  } catch (error) {
    console.error(error);
    res.status(422).send(error.message);
  }
}

function drawChart() {
  let options = {
    title: 'Sample Chart: Average stars',
    vAxis: { title: 'Average stars' },
    height: 600,
    width: 700,
  };
  let data = google.visualization.arrayToDataTable([
    ['author', 'stars'],
    ['alice', 3.75],
    ['bob', 5.0],
    ['charly', 3.5],
    ['ben', 4.3333],
    ['aaron', 1.0],
  ]);

  let chart = new google.visualization.ColumnChart(container);
  chart.draw(data, options);
}
/**
 * Format the chartString for google-charts-node.
 * @param {*} data
 * @param {*} chartType
 * @param {*} options
 */
function formatChartString(data, chartType, options) {
  if (!chartType) {
    chartType = defaultChartType;
  }
  if (options) {
    options = JSON.stringify(options);
  } else {
    options = '{}';
  }
  let s1 = '';

  for (const key of Object.keys(data[0])) {
    //Sometimes the values inside the data are represented as a string even though we want to display it as a number
    if (isActuallyANumber(data[0][key])) {
      s1 += `data.addColumn('number', '${key}');`;
    } else {
      s1 += `data.addColumn('${typeof data[0][key]}', '${key}');`;
    }
  }

  let s2 = `data.addRows([`;
  for (const object of data) {
    //Sometimes the values inside the data are represented as a string even though they might be a number in reality
    let arr = Object.values(object).map((val) => (isActuallyANumber(val) ? Number(val) : val));
    s2 += `${JSON.stringify(arr)},`;
  }
  s2 += ']);';

  return `
  var data = new google.visualization.DataTable();
  ${s1}
  ${s2}
  // Set chart options
  var options = ${options};
  // Instantiate and draw our chart, passing in some options.
  var chart = new google.visualization.${chartType}(document.getElementById('chart_div'));
  chart.draw(data, options);`;
}
/**
 * checks if n is actually a number
 * @param {number} n
 */
function isActuallyANumber(n) {
  return typeof n == 'number' || !isNaN(Number(n));
}
/**
 * checks if data can be visualized with  Google Charts
 * @param {any[][]} data an array of arrays
 */
function checkData(data) {
  if (data.length < 1) {
    throw new Error('no data provided');
  }

  let dataEntrySize = data[0].length; //size which all entries need to be
  if (dataEntrySize < 2) {
    throw new Error('Data entries should have at least two properties');
  }
  for (const arrayEntry of data) {
    if (arrayEntry.length != dataEntrySize) {
      throw new Error('Data entries have different size');
    }
    if (typeof arrayEntry[0] != 'string') {
      throw new Error(
        'The first entry of each datapoint must be of type string, you provided: ' +
          arrayEntry[0] +
          ' of type ' +
          typeof arrayEntry[0]
      );
    }
  }
}
/**
 * removes all array entries smaller than the largest array. In this way each entry will have the same length. This is necessary for Google Charts
 * @param {any[][]} data an array of arrays
 */
function cleanData(data) {
  data = data.map((element) => [...Object.values(element)]);
  let maxEntrySize = getMaxEntrySize(data);
  return data.filter((entry) => entry.length == maxEntrySize);
}
/**
 * Get the maximum length of the entries
 * @param {any[][]} data an array of arrays
 */
function getMaxEntrySize(data) {
  return data.reduce((maxSize, curr) => (curr.length > maxSize ? curr.length : maxSize), 0);
}
