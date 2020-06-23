var config = require('./config');
var axios = require('axios');
var lodash = require('lodash');
var gitlab = require('./gitlab');

gitlab.UpdateInstance(config.token);

var gitlab_axios_instance = axios.create({
  baseURL: config.api_url,
  timeout: 10000,
  headers: { "PRIVATE-TOKEN": config.token}
});


window.addEventListener ("load", Main, false);

function AssignIssueToAssigneId(token,project_id,issue_iid,assigned_id,callback) {
  var data = null;

  var xhr = new XMLHttpRequest();
  xhr.withCredentials = true;

  xhr.addEventListener("readystatechange", function () {
    if (this.readyState === 4) {
      callback && callback(this.responseText)
    }
  });
  xhr.open("PUT", "https://www.lejuhub.com/api/v4/projects/"+project_id+"/issues/"+issue_iid+"?assignee_ids="+assigned_id);
  xhr.setRequestHeader("PRIVATE-TOKEN", token);

  xhr.send(data);
}


function CreateBtn(buttonName,parentdiv,className,clickCallback){
  let divClassName = document.querySelector('#notes > div > ul > li > div > div.timeline-content.timeline-content-form > form > div.note-form-actions > div');
  let div = document.createElement("div");       // Create a <li> node
  let commentBtn = document.createElement("Button");       // Create a <li> node
  commentBtn.className = className;
  var textnode = document.createTextNode(buttonName);  // Create a text node
  commentBtn.addEventListener('click', function() {
    clickCallback();
  });
  div.className = divClassName;
  commentBtn.style.marginLeft = "6px";
  if(buttonName === "warn"){
    commentBtn.style.backgroundColor ="#ff0000";
  }
  else if(buttonName === "good"){
    commentBtn.style.backgroundColor ="#1AAA55";
  }
  else if(buttonName === "Plan"){
      commentBtn.style.backgroundColor ="#FBC250";
  }
  else if(buttonName === "ToChengxin"){
      commentBtn.style.backgroundColor ="#FBC250";
  }
  commentBtn.appendChild(textnode);
  commentBtn.style.color = "black";
  parentdiv.appendChild(commentBtn);
  return commentBtn;
}


function QueryProjectIssue(project,iid,callback){
  gitlab_axios_instance
    .get(
      "/projects/" +
        encodeURIComponent(project) +
        "/issues/"+iid
    )
    .then(data => {
      callback(data.data);
    })
    .catch((err)=>{
      callback(err,null);
    });
}

function GitlabCommentissue(project_id,iid,comment,callback){
  gitlab_axios_instance
    .post("/projects/"+encodeURIComponent(project_id)+"/issues/"+iid+"/notes",{
      body:comment
    })
    .then(()=>{
      callback();
    })
    .catch((error)=>{
      callback(error);
    });
}


function CommentIssue(note){
  let issueInfo = GetCurrentIssueInfo();
  SendMsgToBackgroundPage({type:"comment",note:note,issueInfo});
}
function Main () {
  let commentDiv = document.querySelector('#notes > div > ul > li > div > div.timeline-content.timeline-content-form > form > div.note-form-actions');
  let closeissueBtn = document.querySelector('#notes > div > ul > li > div > div.timeline-content.timeline-content-form > form > div.note-form-actions > button');
  let closeIssueBtn = document.querySelector('#notes > div > ul > li > div > div.timeline-content.timeline-content-form > form > div.note-form-actions > button');
  if(closeIssueBtn){
    closeIssueBtn.addEventListener('click', function() {
      console.log('call close document');
      setTimeout(()=>{
        chrome.runtime.sendMessage({closeThis: true});
      }, 600);
    });
  }
  if (!closeissueBtn) {
    return;
  }
  CreateBtn("good",commentDiv,closeissueBtn.className,()=>{
    CommentIssue("#good");
  });
  CreateBtn("warn",commentDiv,closeissueBtn.className,()=>{
    CommentIssue("#warn");
  });
  CreateBtn("Assign to Plan Bot",commentDiv,closeissueBtn.className,()=>{
    let issueInfo = gitlab.GetCurrentIssueInfo();
    SendMsgToBackgroundPage({type:"assignee",assignee_id:"87",issueInfo});
  });
  CreateBtn("ToChengxin",commentDiv,closeissueBtn.className,()=>{
    let issueInfo = gitlab.GetCurrentIssueInfo();
    SendMsgToBackgroundPage({type:"assignee",assignee_id:"76",issueInfo});
  });
}

function GetCurrentIssueInfo(){
  let curURL = document.URL;
  return GitlabParseURLInfo(curURL);
}

function GitlabParseURLInfo(url){
  let projectInfo = {};
  [projectInfo.groupname,projectInfo.projectname,projectInfo.splitbar,projectInfo.type,projectInfo.mr] =  lodash.split(lodash.split(url,"https://www.lejuhub.com/")[1],'/');
  url_info_array = lodash.split(lodash.split(url,"www.lejuhub.com/")[1],'/');
  var debug_url_info_to_filter = lodash.clone(url_info_array.splice(2));
  [projectInfo.type,projectInfo.mr] = lodash.filter(debug_url_info_to_filter,(o)=>{return o !== "-";});
  projectInfo.project = projectInfo.groupname + '/' + projectInfo.projectname;
  projectInfo.issue_iid = projectInfo.mr.split("?")[0];
  return projectInfo;
}

function SendMsgToBackgroundPage(message){
  chrome && chrome.runtime && chrome.runtime.sendMessage(message);
}

//Alert before reload page for debug 
// window.addEventListener('beforeunload', (event) => {
//   // Cancel the event as stated by the standard.
//   event.preventDefault();
//   // Chrome requires returnValue to be set.
//   event.returnValue = '';
// });
