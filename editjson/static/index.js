var json_viewer = null;
var selected_param = null;
$(document).ready(function(){
    onLoad();
});

function onLoad() {
    // console.log(json_string);
    if (json_string != "null") {
        console.log("loading default json")
        showJSON(json_string);
    } else {
        console.log("no json uploaded")
    }
    d3.select("#exit").on("click", exitDetails);
    d3.select("#param-type").on("change", onSelectType);
}

// taken from https://stackoverflow.com/questions/36127648/uploading-a-json-file-and-using-it
function onChangeFile() {
    console.log("loading uploaded json")
    var files = document.getElementById('file').files;
    console.log(files);
    if (files.length <= 0) {
        return false;
    }

    var fr = new FileReader();

    fr.onload = function(e) {
      console.log(e);
      var title = files.item(0)["name"];
      showJSON(e.target.result, title);
    }

    fr.readAsText(files.item(0));
}

function showJSON(json_string, title="Default JSON") {
    json = JSON.parse(json_string);
    d3.select("#title").html(title);
    d3.select("#param-editor").html("");
    if (json == null) {
    } else if (typeof json == "number") {
    } else if (typeof json == "string") {
    } else if (typeof json == "boolean") {
    } else if (Array.isArray(json)) {
    } else {
        json_viewer = new JSONDictionary(json);
        json_viewer.display(d3.select("#param-editor"));
    }
}

class JSONViewer {
    constructor(json, prefix=[]) {
        this.json = json;
        this.prefix = prefix;
        this.recurse();
    }
    recurse() {
    }
    display(parent_div) {
        this.parent_div = parent_div.html("");
    }
}

class JSONNonLeaf extends JSONViewer {
    recurse() {
        this.viewers = {};
    }
    display(parent_div){
        super.display(parent_div);
        this.container = this.parent_div.append("div").attr("class", "border m-3");
        if (this.isTable()) {
            this.showGridView();
        } else {
            this.showTabView();
        }
    }
    isTable(){
        return false;
    }
    showTabView(){
        this.tabview = true;
        var temp_this = this;
        if (this.isTable()) {
            this.container
              .html("")
              .append("button")
              .attr("class", "btn btn-primary")
              .attr("type", "submit")
              .html("Grid View")
              .on("click", function(){ temp_this.showGridView(); });
        }
        var kv_pair_div = this.container
          .append("div")
          .attr("id", "kvlist")
          .attr("class", "container grid-container")
          .selectAll("div")
          .data(Object.keys(this.viewers).filter(function(e){ return temp_this.viewers[e] instanceof Param; }))
          .enter()
            .append("div")
            .attr("class", "row");
        kv_pair_div
          .append("div")
          .attr("id", function(d){ return d; })
          .attr("class", "col-sm")
          .html(function(d){ return d; });
        kv_pair_div
          .append("div")
          .attr("id", function(d){ return d+"_value"; })
          .attr("class", "col-sm keys")
          .each(function(d){ temp_this.viewers[d].display(d3.select(this)); });

        var tabs = Object.keys(this.viewers).filter(function(e){ return temp_this.viewers[e] instanceof JSONNonLeaf; });

        var tabitems = this.container
          .append("ul")
          .attr("id", "_"+replace_sep_tokens(temp_this.prefix.join("_")))
          .attr("class", "nav nav-tabs")
          .selectAll("li")
          .data(tabs)
          .enter()
            .append("li")
            .attr("class", "nav-item")
            .append("a")
            .attr("class", "nav-link")
            .attr("data-toggle", "tab")
            .attr("href", function(d){ return "#_"+replace_sep_tokens(temp_this.prefix.join("_")+"__"+d); })
            .html(function(d){ return d; })

        var tab_content_wrapper = this.container
          .append("div")
          .attr("class", "tab-content")
        tabs.forEach(function(e){
            var tab_content = tab_content_wrapper.append("div")
              .attr("id", "_"+replace_sep_tokens(temp_this.prefix.join("_")+"__"+e))
              .attr("class", "tab-pane fade");
            temp_this.viewers[e].display(tab_content);
        });
    }
    showGridView(){
        this.tabview = false;
        var temp_this = this;
        if (this.isTable()) {
            this.container
              .html("")
              .append("button")
              .attr("class", "btn btn-primary")
              .attr("type", "submit")
              .html("Tab View")
              .on("click", function(){ temp_this.showTabView(); });
        }
        var grid_container = this.container
          .append("div")
          .attr("class", "container grid-container")
        var columns = Object.keys(Object.values(this.json)[0]);
        grid_container
          .append("div")
          .attr("class", "row")
          .selectAll("div")
          .data([""].concat(columns))
          .enter()
            .append("div")
            .attr("class", "col-sm")
            .html(function(d){ return d; })
        Object.keys(this.viewers).forEach(function(e1){
            var row = grid_container
              .append("div")
              .attr("class", "row");
            row.append("div")
              .attr("class", "col-sm")
              .html(e1);
            Object.keys(temp_this.viewers[e1].viewers).forEach(function(e2){
                var cell = row.append("div")
                  .attr("class", "col-sm");
                temp_this.viewers[e1].viewers[e2].display(cell);
            });
        });
    }
}

class JSONList extends JSONNonLeaf {
}

class JSONDictionary extends JSONNonLeaf {
    recurse() {
        super.recurse();
        var temp_this = this;
        Object.keys(this.json).forEach(function(k){
            var v = temp_this.json[k];
            var new_prefix = temp_this.prefix.concat([k]);
            if (v == null) {
                var viewer = null;
            } else if (typeof v == "number") {
                var viewer = new NumberParam(v, new_prefix);
            } else if (typeof v == "string") {
                var viewer = new StringParam(v, new_prefix);
            } else if (typeof v == "boolean") {
                var viewer = new BooleanParam(v, new_prefix);
            } else if (Array.isArray(v)) {
                var viewer = new JSONList(v, new_prefix);
            } else {
                var viewer = new JSONDictionary(v, new_prefix);
            }
            temp_this.viewers[k] = viewer;
        });
    }
// function isTable(o, checkleaf=false) {
//     rows = Object.keys(o);
//     if (rows.length <= 0) {
//         return false;
//     }
//     if (isLeaf(Object.values(o)[0])) {
//         return false;
//     }
//     columns = Object.keys(Object.values(o)[0]);
//     columns_set = new Set(columns);
//     for (i = 0; i < rows.length; i++) {
//         row_columns = Object.keys(o[rows[i]]);
//         if (row_columns.length != columns.length) {
//             return false;
//         }
//         for (j = 0; j < row_columns.length; j++) {
//             if (!columns_set.has(row_columns[j])) {
//                 return false;
//             }
//             if (checkleaf && !isLeaf(o[rows[i]][row_columns[j]])) {
//                 return false;
//             }
//         }
//     }
//     return true;
// }
    showTabView() {
        super.showTabView();
        var temp_this = this;
        d3.select("#_"+replace_sep_tokens(temp_this.prefix.join("_")))
          .selectAll("a").on("dblclick", function(){ temp_this.changeKeyName(d3.select(this).html()); });
    }
    changeKeyName(key) {
        var temp_this = this;
        if (this.viewers[key] instanceof Param) { // is a key
            if (this.tab_viewers != null) { // tab view
                // tab = this.container.select("")

                //     .classed("hide", true);
                // var input = d3.select(item.node().parentNode)
                //     .append("input")
                //     .attr("class", "form-control")
                //     .attr("placeholder", originalname);
                // $(input.node()).on("click", function(){ return false; });
                // $(document).on("click.forChangeTabName", function(){
                //     temp_this.saveTabName(tabitem, input.node().value);
                //     $(document).off("click.forChangeTabName");
                // });
                // //taken from https://www.w3schools.com/howto/howto_js_trigger_button_enter.asp
                // // Execute a function when the user releases a key on the keyboard
                // input.node().addEventListener("keyup", function(event) {
                //     // Number 13 is the "Enter" key on the keyboard
                //     if (event.keyCode === 13) {
                //         // Cancel the default action, if needed
                //         event.preventDefault();
                //         // Trigger the button element with a click
                //         temp_this.saveTabName(item, input.node().value);
                //     }
                // });
            } else { // grid view
            }
        } else { // is not a key (only in grid view)
            if (this.tab_viewers != null) {
                // dont need to handle this case
            } else { // grid view
            }
        }
    }
    saveKeyName(item, newname){
        // var temp_this = this;
        // item.parentNode().select("input").remove();
        // var a = tabitem.select("a");
        // var originalname = a.html();
        // console.log(originalname);
        // console.log(newname);
        // a.classed("hide", false);
        // if (newname.trim() == "" || originalname == newname) { return; }
        // a
        //   .attr("href", "#"+replace_sep_tokens(temp_this.prefix.join("_")+"__"+newname))
        //   .html(newname);
        // d3.select(tabitem.node().parentNode).select(replace_sep_tokens(temp_this.prefix.join("_")+"__"+originalname))
        //   .attr("id", replace_sep_tokens(temp_this.prefix.join("_")+"__"+newname));

        // //bookkeeping
        // changeKey(this.tabs, originalname, newname);
        // changeKey(this.json, originalname, newname);
        // changeKey(this.tab_viewers, originalname, newname);
        // this.tab_viewers[newname].prefix = this.prefix.concat([newname]);
    }
}

// a json leaf
class Param extends JSONViewer {
}

class StringParam extends Param {
    display(parent_div) {
        var temp_this = this;
        var inputgroup = parent_div.append("div")
          .attr("class", "input-group mb-3");
        inputgroup.append("input")
          .attr("type", "text")
          .attr("class", "form-control")
          .attr("placeholder", this.json)
          .on("keyup", function(){ temp_this.json = this.value; });
        inputgroup.append("div")
          .attr("class", "input-group-append")
          .append("button")
          .attr("type", "button")
          .attr("class", "btn btn-light")
          .html("...")
          .on("click", function(){ openDetails(temp_this.prefix); });
        // change to a dropdown?
        // <div class="dropdown">
        //   <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        //     Dropdown button
        //   </button>
        //   <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
        //     <a class="dropdown-item" href="#">Action</a>
        //     <a class="dropdown-item" href="#">Another action</a>
        //     <a class="dropdown-item" href="#">Something else here</a>
        //   </div>
        // </div>
    }
}

class NumberParam extends StringParam {
}

class BooleanParam extends Param {
    display(parent_div) {
        var temp_this = this;
        var checkdiv = parent_div.append("div")
          .attr("class", "form-check");
        var checkbox = checkdiv
          .append("input")
          .attr("class", "form-check-input")
          .attr("type", "checkbox")
          .attr("value", this.json)
          .attr("id", "_"+replace_sep_tokens(temp_this.prefix.join("_"))+"_checkbox")
          .on("click", function(){
              var label = d3.select("#_"+replace_sep_tokens(temp_this.prefix.join("_"))+"_label");
              label.html(!temp_this.json);
              temp_this.json = !temp_this.json;
          });
        checkbox.node().checked = this.json;
        checkdiv
          .append("label")
          .attr("class", "form-check-label")
          .attr("for", "_"+replace_sep_tokens(temp_this.prefix.join("_"))+"_checkbox")
          .attr("id", "_"+replace_sep_tokens(temp_this.prefix.join("_"))+"_label")
          .html(this.json);
        checkdiv
          .append("button")
          .attr("type", "button")
          .attr("class", "btn btn-light")
          .html("...")
          .on("click", function(){ openDetails(temp_this.prefix); });
    }
}

function replace_sep_tokens(s) {
    return s.replace(/#/g, "_").replace(/ /g, "_").replace(/\//g, "_").replace(/=/g, "_").replace(/>/g, "_").replace(/</g, "_"); //.replace("\#", "_");
}

function changeKey(dictionary, originalname, newname){
    dictionary[newname] = dictionary[originalname];
    delete dictionary[originalname];
}

function getViewerNode(viewer, prefix){
    var curr = viewer;
    for (var i = 0; i < prefix.length; i++) {
        curr = curr.viewers[prefix[i]];
    }
    return curr;
}

function openDetails(prefix) {
    selected_param = prefix;
    console.log(prefix);
    var value = getViewerNode(json_viewer, prefix);
    var param_details = d3.select("body").select("#param-details").classed("hide", false);
    param_details.select("#param-prefix")
      .html(prefix.join(" / "));
    onSelectType();
}

function onSelectType() {
    var value = getViewerNode(json_viewer, selected_param);
    console.log(value);
    var type = d3.select("#param-type").value;
    console.log(type);
    var param_details = d3.select("body").select("#param-details")
    if (type == "one-input") {
        param_details.select("#param-value").html("")
          .append("input")
          .attr("type", "text")
          .attr("class", "form-control")
          .attr("placeholder", value);
    } else if (type == "input-range") {
        var valuediv = param_details.select("#param-value").html("");
        valuediv
          .append("input")
          .attr("type", "text")
          .attr("class", "form-control");
        valuediv.append("text").html("to");
        valuediv
          .append("input")
          .attr("type", "text")
          .attr("class", "form-control");
        valuediv.append("text").html("by");
        valuediv
          .append("input")
          .attr("type", "text")
          .attr("class", "form-control");
    } else {
        var valuediv = param_details.select("#param-value").html("");
        valuediv
          .append("input")
          .attr("type", "text")
          .attr("class", "form-control");
    }
}

function exitDetails() {
    var selected_param = null;
    d3.select("body").select("#param-details").classed("hide", true);
}

