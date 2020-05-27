/*
* set-external-link-target.js
* Sean Murthy
*
* Change the target attribute of external links to "_blank" and add a title and a small
* NE arrow to let the user know that links open in a new tab
* - include only links attached to "a" element
* - exclude links that already have a target (to allow customization in source)
*
* Assumes an appropriate style is set for the span element inserted
*
* Function setExternalLinkTarget is expected to be called on document load 
*/

function setExternalLinkTarget() {
    var anchors = document.getElementsByTagName("A");
    var host_name = window.location.hostname;
    
    for (var i = 0, anchorsLength = anchors.length; i < anchorsLength; i++) {
        var anchor = anchors[i];
        if (anchor.hostname != host_name && anchor.target.length == 0) {
            anchor.target = '_blank';
            anchor.title = 'Opens in new tab';
            anchor.insertAdjacentHTML('afterend', '<span class="external">+</span>');
       }
    }
}
