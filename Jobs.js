

var request     =   require('sync-request');
var cheerio     =   require('cheerio');
var fs          =   require('fs');  
var $           =   require('jquery');
var jsdom       =   require('jsdom');
var jsonfile    =   require('jsonfile');
var keyword     =   require("keyword-extractor");
var math        =   require("mathjs")
var stringify   =   require("json-stringify-pretty-compact")


var jobs = {};

//get all github positions
//Jobs/data.json
jobs.githubData = function(){

    var url  = 'https://jobs.github.com/positions.json';

    var get  = request('GET', url);
    var json = get.body.toString();

    fs.writeFileSync('Jobs/data.json', json, (error) => { /* handle error */ })
}
// jobs.githubData()

jobs.UniqueElements = function(array){

    var unique = [array[0]];
    for(i = 0; i < array.length; i++){
        if(unique.includes(array[i]) === false){
            unique.push(array[i]);
        };
    };
    return unique;
};

//============================================================================================

//don't need this 
jobs.appendGithubData = function(keyword){

    var prevData = JSON.parse(fs.readFileSync('Jobs/data.json'));
    console.log('prevData length = ' + prevData.length);

    var url = 'https://jobs.github.com/positions.json?description=' + keyword;

    var get = request('GET', url);
    var currData = JSON.parse(get.body.toString());
    console.log('currData length = ' + currData.length);

    var json = prevData.concat(currData);
    console.log('joint length = ' + json.length);
    
    fs.writeFileSync('Jobs/data.json', JSON.stringify(json), (error) => { /* handle error */ })
}

//============================================================================================

jobs.reformatGithubData = function(){

    var data = JSON.parse(fs.readFileSync('Jobs/data.json'));

    var reformat  = {};
    var allJobIDs = [];

    data.forEach(function(a){
        var id      = a["id"];
        var title   = a["title"];

        title = title.replace(/\s*\(.*?\)\s*/g, "");
        title = title.split(' - ')[0].split('(')[0].split('[')[0]

        var des     = a["description"];

        des = des.replace(/(<([^>]+)>)/ig, '. '); //no html tags
        des = des.replace(/\n/g, '. '); //no \n

        reformat[id] = {"title": title, "description": des };
        allJobIDs.push(id);
    })

    reformat['allJobIDs'] = allJobIDs;

    // fs.writeFileSync('Jobs/reformatData.json', 'var reformatData = ' + JSON.stringify(reformat, null, 2), (error) => {/* handle error */})

    return reformat;
    //reformat = {
    //         jobID:   {'title': ---, 'description': ---},
    //         jobID:   {'title': ---, 'description': ---},
    //              .....,
    //   'allJobIDs':   [jobID, jobID,...]}
}
// jobs.reformatGithubData()

//============================================================================================

//input:jobID, output:array of keywords from job des
jobs.keyFromDes = function(jobID){

    // var data = JSON.parse(fs.readFileSync('Jobs/reformatData.json'));
    var data = jobs.reformatGithubData();

    var des  = data[jobID]['description'];
        des  = des.split('.').filter(function(a){return a != '' && a!= ' '})

    var keys = [];

    des.forEach(function(a){
        var extracts = keyword.extract(a, {
                            language: "english",
                            remove_digits: false,
                            return_changed_case: true,
                            remove_duplicates: false,
                            return_chained_words: false
                        });
        keys = keys.concat(extracts);
    });

    return keys;
}

// jobs.keyFromDes('f8d4627a-7830-11e7-9e78-d9b1c842a413')

//============================================================================================

//input arrays, number of matches a word must have
//number, [array of key words]
jobs.CommonKey = function(){

    //first argument = number of arrays the word need to be contained
    var args = [];
    for(var i of arguments){
        args.push(i);
    };

    var allKeys = [];

    args[1].forEach(function(a){
        allKeys = allKeys.concat(jobs.keyFromDes(a))
    })

    allKeys = jobs.UniqueElements(allKeys);

    var includedIn = {};

    allKeys.forEach(function(key){
        var included = [];
        args[1].forEach(function(a){
            if(jobs.keyFromDes(a).includes(key)){
                included.push(1);
            }else{
                included.push(0);
            }
        })
        includedIn[key] = included;
    })
    
    var commonKeys = [];
    allKeys.forEach(function(key){
        if(includedIn[key].reduce( (prev,curr) => prev + curr) >= args[0]){
            commonKeys.push(key);
        }
    })

    return commonKeys

}


//============================================================================================


jobs.CommonKeyTwo = function(jobID, keyArrayB){

    var commonKey = [];

    var keyArrayA = jobs.keyFromDes(jobID);

    keyArrayA.forEach(function(a){
        if(keyArrayB.includes(a) && a.includes('undefined') === false){
            commonKey.push(a);
        }
    })

    //return jobs.UniqueElements(commonKey);
    return commonKey;
}

//============================================================================================

var KeyWords = {}
KeyWords.DataScience = ["data science", "data", "great data", "data management", "big data", "analytics", "machine learning", "python", "visualization", "deep leaarning", "data mining"];
KeyWords.SoftwareEngineer = ["agile", "c#", "c++", "collaborate", "team", "code", "java", ".net", "mobile", "software", "solution", "solutions", "projects", "sql", "team", "development", "design", "web", "testing"]

jobIDs = [
'f8d4627a-7830-11e7-9e78-d9b1c842a413',
'52a4e146-4e3f-11e8-8ef6-3fb76ee048bf',
'a10e0222-9701-11e7-99b5-3e0083d090e0',  
'f127a8ca-fdd3-11e6-81a4-fe9da905eb01',  
'fa2381ba-fdd3-11e6-82c5-5b93b6d5fc76',  
'cd788a5e-97cd-11e7-81ed-ae7d47995799',  
'db9ef0f4-bfe7-11e7-98d4-d371577aa6c0',  
'15a1bd48-10da-11e8-8dd7-7617cf12b322',  
'40a95a22-4e20-11e8-9701-1b7423468ecc',  
'3f1f876c-4e20-11e8-94e4-aed74a007765',  
'3ca6476e-4e20-11e8-9201-52efa277c307',  
'1860dbd2-4e0a-11e8-824d-e9573fe33079',  
'c20a142a-4dfe-11e8-8bba-6e4e388640ae',  
'dab58272-4de3-11e8-9545-092ffb7f19b9',  
'409714aa-4de1-11e8-8546-20a952dfe08d',  
'428e51e4-4ddf-11e8-8a07-67eb144e5584',  
'f711f746-4ddb-11e8-8ba9-0bea8d2448e9',  
'949e5a7a-4d57-11e8-9178-6a21e83a3735',  
'776c9e60-4ca0-11e8-9860-71a43ad1cbdd',  
'eea00520-3487-11e8-9403-ba1a7cdf47b1',  
'7f854636-4c8e-11e8-89a6-641eafe1cf00',  
'd4ce5b1a-4c8d-11e8-8316-de2ea6887ec8',  
'3e405d78-1b29-11e8-88c9-b4b578163b5c',  
'fb6a544e-1b29-11e8-8062-e14cc69ae428',  
'f0204a80-4c57-11e8-953f-45c6f7e56dd0',  
'287b3c52-4a80-11e8-95d7-60a5a19c6c42',  
'2782ebb6-4a75-11e8-9ebb-47d33cbed1ee',  
'd37afd36-4a67-11e8-9114-574d811607c3',  
'cd806b64-4a21-11e8-9e08-652c5e9ffe1f',  
'f9de27fc-49f2-11e8-8e67-bca1a68363e5',  
'0c378362-49b2-11e8-89d0-6340ff903843',  
'ad6e9774-4977-11e8-808a-edb2ba4acd39',
'a9e2d160-4977-11e8-8e7c-9d7c584925f8',
'a6797222-4977-11e8-88ae-c942baa6c401',
'a322bd0e-4977-11e8-82a2-f8413ac78eba',
'9f891a9e-4977-11e8-9f66-9072f030ce32',
'9c016b88-4977-11e8-877b-11c4ecdc8f84',
'97786436-4977-11e8-8fe4-cb6755acd02c',
'9466830e-4977-11e8-9583-d87ccdb8d62b',
'9086d6d0-4977-11e8-8145-1c846733c22f',
'8caa6e1e-4977-11e8-9cb3-2c79226a2c46',  
'85200708-4977-11e8-92ee-e4b23655e198',
'950b165c-496e-11e8-8291-f5e6e2589515',  
'91b7623a-496e-11e8-923b-adce64dba9ba',
'8e2eaf6a-496e-11e8-8554-1b960f76d2e2',
'89450de6-496e-11e8-8bd7-29d1c07e8855',
'80419840-496e-11e8-8be1-8e491a6480fb',
'6860c742-4968-11e8-92ff-224f2e12c7e2',
'254cffc8-4965-11e8-8691-2f098e1e702d',
'7ab6bac2-4964-11e8-9649-30ee0d9c61f2' ]

jobs.Cluster = function(jobIDs, centroidKey){

    var weights = {};
    // var data = JSON.parse(fs.readFileSync('Jobs/reformatData.json'));
    var data = jobs.reformatGithubData();

    jobIDs.forEach(function(id){
        var weight = [];
        centroidKey.forEach(function(a){
            weight.push(jobs.CommonKeyTwo(id,a).length);
        })
        weights[id] = {};
        weights[id]['weight'] = weight;

        var title = data[id]['title'].toUpperCase();
        weights[title] = {};
        weights[title]['weight'] = weight;
    })

    centroidKey.forEach(function(a){
        var index = 'cluster ' + centroidKey.indexOf(a);
        weights[index] = [];
    })

    jobIDs.forEach(function(id){
        var max = math.max(weights[id]['weight']);
        var index = weights[id]['weight'].indexOf(max);

        var title = data[id]['title'].toUpperCase();
        weights[title]['cluster'] = index;
        weights[id]['cluster'] = index;

        var clusterKeys = jobs.CommonKeyTwo(id, centroidKey[index]);
        clusterKeys = jobs.UniqueElements(clusterKeys)
        weights[title]['clusterKeys'] = clusterKeys;

        weights['cluster ' + index].push( {'id': id, 'title': data[id]['title']} );
    })


    centroidKey.forEach(function(a){
        var index = 'cluster ' + centroidKey.indexOf(a);
        var jobids = [];
        weights[index].forEach(function(id){
            if(id['id'] != undefined){
                jobids.push(id['id'])
            }
        })
        weights[index + ' keys'] = {};

        a.forEach(function(key){
            var boolean = [];
            jobids.forEach(function(id){
                if(jobs.keyFromDes(id).includes(key)){
                    boolean.push(1);
                }else{
                    boolean.push(0);
                }
            })
            // weights[index + ' keys'][String(key)] = boolean;
            weights[index+ ' keys'][key] = {}
            weights[index+ ' keys'][key]['boolean'] = boolean;
            weights[index+ ' keys'][key]['weight'] = boolean.reduce((prev,curr) => prev+curr);
        })
    })

    // console.log(weights);
    fs.writeFileSync('Jobs/cluster.js', 'var cluster = ' + JSON.stringify(weights, null, 1 ), (error) => {/* handle error */})
}

jobs.Cluster(jobIDs, [KeyWords.DataScience, KeyWords.SoftwareEngineer])

