const o={};chrome.runtime.onConnect.addListener(function(i){const s=function(e,n){if(e.name==="init"){o[e.tabId]=n;return}console.debug("message is ",e)};i.onMessage.addListener(s),i.onDisconnect.addListener(function(e){e.onMessage.removeListener(s);const n=Object.keys(o);for(var t=0,r=n.length;t<r;t++)if(o[n[t]]===e){delete o[n[t]];break}})});chrome.runtime.onMessage.addListener(function(i,s,e){var t;if(s.tab){var n=(t=s.tab.id)==null?void 0:t.toString();n!=null&&n in o?o[n].postMessage(i):console.warn("Tab not found in connection list.")}else console.warn("sender.tab not defined.");return!0});
