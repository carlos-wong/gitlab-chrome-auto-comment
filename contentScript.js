var config = require('./config');
var axios = require('axios');
var lodash = require('lodash');

console.log('auto comment extension loaded');

var gitlab_axios_instance = axios.create({
  baseURL: config.api_url,
  timeout: 10000,
  headers: { "PRIVATE-TOKEN": config.token}
});

window.addEventListener ("load", myMain, false);

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
  commentBtn.appendChild(textnode);
  commentBtn.style.color = "black";
  parentdiv.appendChild(commentBtn);
  return commentBtn;
}

function GitAssigneeUsername(issue){
  return issue && issue.assignee && issue.assignee.username;
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

function CommentCmd(data,note){
  let username = GitAssigneeUsername(data);
  let authorUsername = data.author.username;
  let iid = data.iid;
  let project_id = data.project_id;
  if(username === 'Softdev-QA-bot'){
    username = authorUsername;
  }
  GitlabCommentissue(project_id,iid,note+" @"+(username || authorUsername)+ " @softdev-global",(error)=>{console.log('comment error:',error);});
}

function CommentIssue(note,commandCmd){
  let issueInfo = GetCurrentIssueInfo();
  QueryProjectIssue(issueInfo.project,issueInfo.mr,(data)=>{
    commandCmd(data,note);
  });
}

function myMain () {
  let commentDiv = document.querySelector('#notes > div > ul > li > div > div.timeline-content.timeline-content-form > form > div.note-form-actions');
  let closeissueBtn = document.querySelector('#notes > div > ul > li > div > div.timeline-content.timeline-content-form > form > div.note-form-actions > button');
  let closeIssueBtn = document.querySelector('#notes > div > ul > li > div > div.timeline-content.timeline-content-form > form > div.note-form-actions > button.btn-close.js-note-target-close.btn.btn-comment.btn-comment-and-close.js-action-button');
  if(closeIssueBtn){
    closeIssueBtn.addEventListener('click', function() {
      console.log('call close document');
      setTimeout(()=>{
        chrome.runtime.sendMessage({closeThis: true});
      }, 600);
    });
  }
  CreateBtn("good",commentDiv,closeissueBtn.className,()=>{
    CommentIssue("#good",CommentCmd);
  });
  CreateBtn("warn",commentDiv,closeissueBtn.className,()=>{
    CommentIssue("#warn",CommentCmd);
  });
  CreateBtn("Plan",commentDiv,closeissueBtn.className,()=>{
    CommentIssue("#warn",(data,note)=>{
      let iid = data.iid;
      let project_id = data.project_id;
      GitlabCommentissue(project_id,iid,config.planbotAssignCmd,(error)=>{
        console.log('comment error:',error);
        chrome.runtime.reload ();
      });
    });

  });

}

function GetCurrentIssueInfo(){
  let curURL = document.URL;
  return GitlabParseURLInfo(curURL);
}

function GitlabParseURLInfo(url){
  let projectInfo = {};
  [projectInfo.groupname,projectInfo.projectname,projectInfo.type,projectInfo.mr] =  lodash.split(lodash.split(url,"http://www.lejuhub.com/")[1],'/');
  projectInfo.project = projectInfo.groupname + '/' + projectInfo.projectname;
  return projectInfo;
}



