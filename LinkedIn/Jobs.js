var request  = require("sync-request");
var cheerio  = require("cheerio");
var fs       = require("fs");
var jq       = require("jquery");
var jsdom    = require("jsdom");
var jsonfile = require("jsonfile");
var keyword  = require("keyword-extractor");
var math     = require("mathjs")


var jobs = {}

var KeyWords = {}
KeyWords.DataScience = ["data science", "data", "great data", "data management", "big data", "analytics", "machine learning", "python", "visualization", "deep leaarning", "data mining"];
KeyWords.SoftwareEngineer = ["agile", "c#", "c++", "collaborate", "team", "code", "java", ".net", "mobile", "software", "solution", "solutions", "projects", "sql", "team", "development", "design", "web", "testing"]
KeyWords.Biotech = ["phd", "research", "cell", "biochemistry", "biology", "biophysics", "biomolecular", "calorimetry", "spectroscopy", "protein", "analysis"]

var IDs = [
    671112765, //01 Shyft, Solution Developer, Entry level
    592120017, //02 Geiko, Entry Level Software Developer, Entry level
    611776321, //03 Deutsche Bank, Java Developer, Entry level
    644589134, //04 Wayfair, Data Scientist PhD, Entry level
    610433771, //05 AWS, Data Scienctist, na
    597934372, //06 Adobe, Data Scientist, Entry level
    623266739, //07 State Street, Quantitative Analyst, na
    649381579, //08 Fidelity, Quantitative Developer, Associate
    632531333, //09 Novartis, Proteomics Research Scientist, Associate
    632532043, //10 Novartis, Scientific Associate II - Biochemistry/Biophysics
    632532499, //11 Novartis, Scientific Associate, Associate
    632597581, //12 McGrawHill, Platform Engineering, Director
    629866611, //13 New York Times, Data Scientist
    629691619, //14 Illumina, Machine Learning AI Engineer
    670036417, //15 Cisco, Machine Learning Engineer
    593671734, //16 Mashing Inc, Deep Learning Engineer
    604090266, //17 Amazon, Machine Learning Engineer
    638387431, //18 Bose, Software Automation Engineer
    573124744, //19 Comcast, Test Engineerg 
    662976125  //20 Citi, Quantitative Analyst
];

jobs.GetData = function(jobID){
    var jobData = cheerio.load(fs.readFileSync( 'jobsHtml/' + jobID + '.html' )).html();
    var data    = jobData.split('">')[1]
                         .split('</code>')[0]
    var json    = JSON.parse(data.replace(/&quot;/g, '"'));
    var jsonString = JSON.stringify( json, null, 2 );
    var IDname = 'job' + jobID.toString();
    
    fs.writeFileSync( 'JobsJS/' +  jobID + '.js', 'var ' + IDname + '=' + jsonString, (error) => {/*handle error*/});
    fs.writeFileSync( 'jobsJson/' +  jobID + '.json', jsonString, (error) => {/*handle error*/});
}
//========================================================


//output: text blob
jobs.getJSON = function(jobID, property){
    //property: companyName, jobTitle, jobDescription

    var data = fs.readFileSync('jobsJson/' + jobID +'.json');
    var jobData = JSON.parse(data);

    if(property === 'companyName'){
        var txt = 'com.linkedin.voyager.jobs.JobPostingCompany'
        var compname = jobData.companyDetails[txt].companyResolutionResult.name
        return compname;
    }
    if(property === 'jobTitle'){
        return jobData.title;
    }
    if(property === 'jobDescription'){
        return jobData.description.text;
    }

};

//========================================================

//input: jobID
//output: array, keywords from job description
jobs.Key = function(jobID){

    var text = jobs.getJSON(jobID, 'jobDescription');

    var splitLine   = text.split('\n');
    var splitPeriod = splitLine.reduce(function(prev, curr){return prev.concat(curr.split('. ')) }, []);
    var splitComma  = splitPeriod.reduce(function(prev,curr){return prev.concat(curr.split(', '))}, []);

    var clean = [];

    splitComma.forEach(function(a){
        var extracts = keyword.extract(a, {
                            language: "english",
                            remove_digits: false,
                            return_changed_case: true,
                            remove_duplicates: false,
                            return_chained_words: false
                        });
        clean.push(extracts);
    });
    clean = clean.filter(function(a){return a!='undefined' && a!=undefined})

    var key = [];

    clean.forEach(function(a){
        for(var i = 0; i < a.length; i++){
            if(i < a.length-3){
                key.push(a[i]);
                key.push(a[i] + ' ' + a[i+1])
                key.push(a[i] + ' ' + a[i+1] + ' ' + a[i+2]);
            }
            if(i === a.length-2){
                key.push(a[i]);
                key.push(a[i] + ' ' + a[i+1])
            }
            if(i === a.length-1){
                key.push(a[i]);
            }
        }
    })

    return key;
};


//========================================================

jobs.UniqueElements = function(array){

    var unique = [array[0]];
    for(i = 0; i < array.length; i++){
        if(unique.includes(array[i]) === false){
            unique.push(array[i]);
        };
    };
    return unique;
};

//output: counts = {keyword: #occurance, repeat: [repeated keywords]}
jobs.FindRepeated = function(array){

    var counts = {};
    array.forEach(function(a){ counts[a] = (counts[a] || 0) + 1 });

    var unique = jobs.UniqueElements(array);
    var repeat = [];
    unique.forEach(function(a){
        if(counts[a] > 1){
            repeat.push(a);
        }
    })    
    counts.repeat = repeat;

    return counts;
}

//max element
jobs.max = function(array){
    var max = 0;
    array.forEach(function(a){
        if( max >= a ){
            max = max;
        }
        if( max <= a ){
            max = a;
        }
    })
    return max
}

//========================================================

//input array
//output array
jobs.CommonKey = function(keyArrayA, keyArrayB){

    var commonKey = [];

    keyArrayA.forEach(function(a){
        if(keyArrayB.includes(a) && a.includes('undefined') === false){
            commonKey.push(a);
        }
    })

    //return jobs.UniqueElements(commonKey);
    return commonKey;
}

//========================================================


jobs.Weight = function(jobA, jobB){

    if( typeof jobB === "number"){
        var commonKeys = jobs.CommonKey(jobs.Key(jobA), jobs.Key(jobB));
    }else{
        var commonKeys = jobs.CommonKey(jobs.Key(jobA), jobB);
    }

    var uniqueWeight = jobs.UniqueElements(commonKeys).length*0.25;

    var repeatKeys = jobs.FindRepeated(commonKeys).repeat;
    var repeatWeight = repeatKeys.reduce(function(prev, curr){
        var currVal = jobs.FindRepeated(commonKeys)[curr]*2;
        return prev + currVal;
    }, 0)


    return uniqueWeight + repeatWeight;
}
//========================================================

//Get cluster with given centroid
jobs.knm = function(jobsArray, clusterKeys){

    //initiate cluster
    cluster0 = clusterKeys.DataScience;
    cluster1 = clusterKeys.SoftwareEngineer;
    cluster2 = clusterKeys.Biotech;

    //initial weigh
    weights = {};

    jobsArray.forEach(function(id){
        var d = [jobs.Weight(id, cluster0), jobs.Weight(id, cluster1), jobs.Weight(id, cluster2)];
        weights[id] = d;
    })

    //find maximums
    assignment = {totalWeight: 0};

    jobsArray.forEach(function(id){
        var maxWeight = jobs.max(weights[id]);
        assignment.totalWeight += maxWeight;
        var index = weights[id].indexOf(maxWeight);
        assignment[id] =  index;
    })

    clusterCount = {};
    clusterJobIDs = {cluster0:[], cluster1:[], cluster2:[]};
    jobsArray.forEach(function(a){
        var clusterID = 'cluster' + assignment[a];
        clusterCount[clusterID] =  (clusterCount[clusterID] || 0) + 1;
        clusterJobIDs[clusterID].push(a);
        //console.log(clusterJobIDs);
    });

    return {'weight': weights,
            'assignment': assignment,
            'clusterCount' : clusterCount,
            'clusterJobIDs' : clusterJobIDs};
}

console.log(jobs.knm(IDs, KeyWords))

//input: array of keys of each job
//output: common key of the cluster
jobs.CentroidKey = function(){

    //collect all arguments
    var args = [];
    for(var i of arguments){
        args.push(i);
    };
    args = args[0];

    var idKey = {}; //id: [arry of keys]
    var allKey = []; //[joint keys]

    args.forEach(function(id){
        var getKeys = jobs.Key(id);
        idKey[id] = getKeys
        allKey = allKey.concat(getKeys)
    })

    allKey = jobs.UniqueElements(allKey);

    //keys that appear in multiple job descriptions
    var clusterKey = [];
    allKey.forEach(function(a){
        checkIncludes = [];
        args.forEach(function(id){
            if(idKey[id].includes(a)){
                checkIncludes.push('true');
            }
        })
        if(checkIncludes.length > args.length-1){
            clusterKey.push(a);
        }
    })
    return clusterKey;
    //return args;
}



jobs.writeJSON = function(jobsArray, clusterKeys){

    var clusters = ['cluster0', 'cluster1', 'cluster2'];

    var titles = {};

    clusters.forEach(function(a){
        var jobTitles = [];
        var ids =  jobs.knm(jobsArray, clusterKeys)['clusterJobIDs'][a];
        ids.forEach(function(b){
            jobTitles.push(jobs.getJSON(b, 'jobTitle'));
        })

        titles[a + 'titles'] = jobs.UniqueElements(jobTitles);

        titles[a + 'commonKeys'] = jobs.CentroidKey(ids)
    })


    var json = JSON.stringify(titles, null, 2);

    fs.writeFileSync('jobData.json', json, (error) => { /* handle error */ });

    //return titles;
}

