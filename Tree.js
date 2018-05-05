

var treeData = {};

// loadJSON = function(file){
//     var xobj = new XMLHttpRequest();
//     //true -> false
//     xobj.open('GET', file, false);
//     xobj.onload = function (){
//         if (xobj.readyState == 4 && xobj.status == "200") {
//         var json = JSON.parse(xobj.response)
//         return json
//         }
//     };
//     xobj.send(Int8Array);
//     return xobj.onload();
// };


//====================================================================================

var UniqueElements = function(array){

    var unique = [array[0]];
    for(i = 0; i < array.length; i++){
        if(unique.includes(array[i]) === false){
            unique.push(array[i]);
        };
    };
    return unique;
};


var jobTree = function(jobtitle, numberOfClusters){

    //tree template
    treeData =
    {"name": jobtitle,
    "children": [
        { "name": "Related Job Titles",
            //"children": []
        },
        { "name": "Associated Keywords",
            //"children": []
        }]
        };

    //load data: cluster.js
    var data = cluster;

    //cluster ids
    var clusterid = [];
    for(var i = 0; i < numberOfClusters; i++){
        clusterid.push('cluster ' + i);
    }

    var jobClusterID = data[jobtitle]['cluster'];

    var relatedJobs = [];
    data['cluster ' + jobClusterID].forEach(function(a){
        relatedJobs.push({'name': a['title']});
    })
    treeData['children'][0]['children'] = relatedJobs;

    var relatedKeys = [];
    var keys = [];
    data[jobtitle]['clusterKeys'].forEach(function(key){
        relatedKeys.push({'name': key});
        keys.push(key);
    })
    treeData['children'][1]['children'] = relatedKeys;

    return treeData;
}


var jobKeyFilter = function(jobtitle){

    console.log('(clicked JobSearch) input: ' + jobtitle)

    
    var input   = document.getElementById("input").value.toUpperCase();
    var keyword = input.split(' ');
    

    //get all collapsibles
    var title   = document.getElementsByClassName("collapsible")
    var length  = title.length;
    var des    = document.getElementsByClassName("content");
  
    //keyword included in text?
    var check = function(keyArray, textBlob){
      return keyArray.every( key => textBlob.innerHTML.toUpperCase().indexOf(key) > -1)
    }
    var jobCheck = function(keyArray, textBlob){
        var tf = [];
        keyArray.forEach( key => tf.push( textBlob.innerHTML.toUpperCase().indexOf(key) > -1 ))
        if(tf.includes(true)){
            return true;
        }else{
            return false;
        }
    }
  
    //identify all active filter buttons
    var active= []; 
    $("button#term.active").each(function(index){
      if($(this).html().includes("img")){
        active.push($("img", this).attr("src"));
      }else{
        active.push($(this).text());
      }
    })

    var jobKeys = [];
    cluster[jobtitle]['clusterKeys'].forEach(a => jobKeys.push(a.toUpperCase()))

    var countTitles = 0;
    for (var i = 2; i < title.length; i++) {

        var hasKey = (check(keyword, title[i]) || check(keyword, des[i]));
        var hasjobKey = (jobCheck(jobKeys, title[i]) || jobCheck(jobKeys, des[i]));

        var hasLogo = active.reduce(function(prev,curr){
        if(curr === undefined){
            console.log(curr.innerHTML)
        }
        if(curr.includes("Logos")){
            //logo term filter
            curr = title[i].innerHTML.includes(curr);
        }else{
            //UG
            curr = curr.includes(title[i].innerHTML.split(' | ')[1][0]);
        }
        return prev && curr;
        }, true);


        if(input = '' && hasLogo === true && jobKeys === [null]){
            title[i].style.display = "";
            countTitles = countTitles + 1;
          }else if( hasKey === true && hasLogo === true && hasjobKey === true) {
              //show
              title[i].style.display = "";
              des[i].style.display = "";
              countTitles = countTitles + 1;
          } else {
              //hide
              title[i].style.display = "none";
              des[i].style.display = "none";
          }

    }
    console.log('number of courses listed: ' + countTitles);
    console.log('=================================================================');


}

//====================================================================================


var Tree = function(jobtitle){

    jobTree(jobtitle,2);

    var data = cluster;
    var jobClusterID = data[jobtitle]['cluster'];
    var heightVar = data['cluster ' + jobClusterID].length*50

// Set the dimensions and margins of the diagram
var margin = {top: 20, right: 40, bottom: 30, left: 300},
    width = 1200 - margin.left - margin.right,
    height = heightVar - margin.top - margin.bottom;

// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
d3.select("svg").remove();
var svg = d3.select("div#jobsresult").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate("
          + margin.left + "," + margin.top + ")");

var i = 0,
    duration = 750,
    root;

// declares a tree layout and assigns the size
var treemap = d3.tree().size([height, width]);

// Assigns parent, children, height, depth
root = d3.hierarchy(treeData, function(d) { return d.children; });
root.x0 = height / 2;
root.y0 = 0;

// Collapse after the second level
root.children.forEach(collapse);

update(root);

// Collapse the node and all it's children
function collapse(d) {
  if(d.children) {
    d._children = d.children
    d._children.forEach(collapse)
    d.children = null
  }
}

function update(source) {

  // Assigns the x and y position for the nodes
  var treeData = treemap(root);

  // Compute the new tree layout.
  var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

  // Normalize for fixed-depth.
  nodes.forEach(function(d){ d.y = d.depth * 180});


  //===================================node=====================================


  // Update the nodes...
  var node = svg.selectAll('g.node')
      .data(nodes, function(d) {return d.id || (d.id = ++i); });

  // Enter any new modes at the parent's previous position.
  var nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr("transform", function(d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
    })
    .on('click', click);

  // Add Circle for the nodes
  nodeEnter.append('circle')
      .attr('class', 'node')
      .attr('r', 1e-6)
      .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#fff";
      });

  // Add labels for the nodes
  nodeEnter.append('text')
      .attr("dy", ".35em")
      .attr("x", function(d) {
          return d.children || d._children ? -13 : 13;
      })
      .attr("text-anchor", function(d) {
          return d.children || d._children ? "end" : "start";
      })
      .text(function(d) { return d.data.name; });

  // UPDATE
  var nodeUpdate = nodeEnter.merge(node);

  // Transition to the proper position for the node
  nodeUpdate.transition()
    .duration(duration)
    .attr("transform", function(d) { 
        return "translate(" + d.y + "," + d.x + ")";
     });

  // Update the node attributes and style
  nodeUpdate.select('circle.node')
    .attr('r', 10)
    .style("fill", function(d) {
        return d._children ? "lightsteelblue" : "#fff";
    })
    .attr('cursor', 'pointer');


  // Remove any exiting nodes
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) {
          return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

  // On exit reduce the node circles size to 0
  nodeExit.select('circle')
    .attr('r', 1e-6);

  // On exit reduce the opacity of text labels
  nodeExit.select('text')
    .style('fill-opacity', 1e-6);



//===================================link=====================================


  // Update the links...
  var link = svg.selectAll('path.link')
      .data(links, function(d) { return d.id; });

  // Enter any new links at the parent's previous position.
  var linkEnter = link.enter().insert('path', "g")
      .attr("class", "link")
      .attr('d', function(d){
        var o = {x: source.x0, y: source.y0}
        return diagonal(o, o)
      });

  // UPDATE
  var linkUpdate = linkEnter.merge(link);

  // Transition back to the parent element position
  linkUpdate.transition()
      .duration(duration)
      .attr('d', function(d){ return diagonal(d, d.parent) });

  // Remove any exiting links
  var linkExit = link.exit().transition()
      .duration(duration)
      .attr('d', function(d) {
        var o = {x: source.x, y: source.y}
        return diagonal(o, o)
      })
      .remove();

  // Store the old positions for transition.
  nodes.forEach(function(d){
    d.x0 = d.x;
    d.y0 = d.y;
  });

  // Creates a curved (diagonal) path from parent to the child nodes
  function diagonal(s, d) {

    path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`

    return path
  }

  // Toggle children on click.
  function click(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
    update(d);
  }
}}