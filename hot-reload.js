var config = require('./config');
var axios = require('axios');
var lodash = require('lodash');
var gitlab = require('./gitlab');

gitlab.UpdateInstance(config.token);


const filesInDirectory = dir => new Promise (resolve =>

    dir.createReader ().readEntries (entries =>

        Promise.all (entries.filter (e => e.name[0] !== '.').map (e =>

            e.isDirectory
                ? filesInDirectory (e)
                : new Promise (resolve => e.file (resolve))
        ))
        .then (files => [].concat (...files))
        .then (resolve)
    )
)

const timestampForFilesInDirectory = dir =>
        filesInDirectory (dir).then (files =>
            files.map (f => f.name + f.lastModifiedDate).join ())

const reload = () => {
    chrome.tabs.query ({ active: true, currentWindow: true }, tabs => { // NB: see https://github.com/xpl/crx-hotreload/issues/5

        if (tabs[0]) { chrome.tabs.reload (tabs[0].id) }

        chrome.runtime.reload ()
    })
}

const watchChanges = (dir, lastTimestamp) => {

    timestampForFilesInDirectory (dir).then (timestamp => {

        if (!lastTimestamp || (lastTimestamp === timestamp)) {

            setTimeout (() => watchChanges (dir, timestamp), 1000) // retry after 1s

        } else {

            reload ()
        }
    })

}

chrome.management.getSelf (self => {

    if (self.installType === 'development') {

        chrome.runtime.getPackageDirectoryEntry (dir => watchChanges (dir))
    }
});


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log(message);
  if(message.closeThis){
    chrome.tabs.remove(sender.tab.id);
  }else if(message.type === "assignee"){
    let issueInfo = message.issueInfo;
    gitlab.AssigneeIssue(issueInfo.project,issueInfo.mr,message.assignee_id,(error)=>{
      console.log("after assgineed issue ");
    });
  }else if(message.type === "comment"){
    let issueInfo = message.issueInfo
    let note = message.note;
    console.log("Tryo to comment issue");
    gitlab.QueryProjectIssue(issueInfo.project,issueInfo.mr,(data)=>{
      console.log("Try to comment depend on data:",data);
      gitlab.CommentCmd(data,note);
    });
  }else if(message.type === "LGTM"){
    let issueInfo = message.issueInfo
    let note = message.note;
    gitlab.QueryProjectIssue(issueInfo.project,issueInfo.mr,(data)=>{
      gitlab.CommentCmd(data,note);
    });
  }
});
