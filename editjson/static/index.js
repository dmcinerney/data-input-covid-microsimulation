var jsonviewer = null;
$(document).ready(function(){
    onLoad();
});

function onLoad() {
    console.log(json_string);
    if (json_string) {
        console.log("loading default json")
        showJSON(json_string);
    } else {
        console.log("no json uploaded")
    }
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
      var title = "title";
      showJSON(e.target.result, title); // TODO: show actual uploaded json
      // var result = JSON.parse(e.target.result);
      // var formatted = JSON.stringify(result, null, 2);
      //     document.getElementById('result').value = formatted;
    }

    fr.readAsText(files.item(0));
}

function showJSON(json_string, title="default") {
    json = JSON.parse(json_string);
    d3.select("#param-editor").html("");
    jsonviewer = new JSONViewer(json, d3.select("#param-editor"));
}

class JSONViewer {
    constructor(json, parent_div, prefix=[]) {
        var temp_this = this;
        this.json = json;
        this.parent_div = parent_div;
        this.prefix = prefix;
        this.container = this.parent_div.append("div").attr("class", "border m-3");
        this.params = {};
        this.tabs = {};
        Object.keys(json).forEach(function(e){
            if (isLeaf(temp_this.json[e])) {
                temp_this.params[e] = temp_this.json[e];
            } else {
                temp_this.tabs[e] = temp_this.json[e];
            }
        });
        if (isTable(this.json, true)) {
            this.showGridView();
        } else {
            this.showTabView();
        }
    }
    showGridView(){
        this.tab_viewers = {};
        this.grid_viewers = {};
        var temp_this = this;
        if (isTable(this.json)) {
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
        Object.keys(this.json).forEach(function(e1){
            var row = grid_container
              .append("div")
              .attr("class", "row");
            row.append("div")
              .attr("class", "col-sm")
              .html(e1);
            temp_this.grid_viewers[e1] = {};
            Object.keys(temp_this.json[e1]).forEach(function(e2){
                var cell = row.append("div")
                  .attr("class", "col-sm");
                if (isLeaf(temp_this.json[e1][e2])) {
                    temp_this.addInput(cell, temp_this.json[e1][e2], temp_this.prefix.concat([e1, e2]));
                } else {
                    temp_this.grid_viewers[e1][e2] = new JSONViewer(temp_this.json[e1][e2], cell, temp_this.prefix.concat([e1, e2]));
                }
            });
        });
    }
    showTabView(){
        this.tab_viewers = {};
        this.grid_viewers = {};
        var temp_this = this;
        if (isTable(this.json)) {
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
          .attr("class", "container grid-container")
          .selectAll("div")
          .data(Object.keys(this.params))
          .enter()
            .append("div")
            .attr("class", "row");
        kv_pair_div
          .append("div")
          .attr("class", "col-sm")
          .html(function(d){ return d; });
        kv_pair_div
          .append("div")
          .attr("class", "col-sm")
          .each(function(d){ temp_this.addInput(d3.select(this), temp_this.json[d], temp_this.prefix.concat([d])); });

        this.container
          .append("ul")
          .attr("class", "nav nav-tabs")
          .selectAll("li")
          .data(Object.keys(this.tabs))
          .enter()
            .append("li")
            .attr("class", "nav-item")
            .append("a")
            .attr("class", "nav-link")
            .attr("data-toggle", "tab")
            .attr("href", function(d){ return "#"+replace_sep_tokens(temp_this.prefix.join("_")+"__"+d); })
            .html(function(d){ return d; });
        var tab_content_wrapper = this.container
          .append("div")
          .attr("class", "tab-content")
        Object.keys(this.tabs).forEach(function(e){
            var tab_content = tab_content_wrapper.append("div")
              .attr("id", replace_sep_tokens(temp_this.prefix.join("_")+"__"+e))
              .attr("class", "tab-pane fade");
            temp_this.tab_viewers[e] = new JSONViewer(temp_this.tabs[e], tab_content, temp_this.prefix.concat([e]));
        });
    }
    addInput(parent, element, prefix){
        if ((typeof element == "number") || (typeof element == "string")) {
            parent.append("input")
              .attr("class", "form-control")
              .attr("placeholder", element);
        } else if (typeof element == "boolean") {
            var checkdiv = parent.append("div")
              .attr("class", "form-check");
            checkdiv
              .append("input")
              .attr("class", "form-check-input")
              .attr("type", "checkbox")
              .attr("value", element)
              .attr("id", replace_sep_tokens(prefix.join("_")));
            checkdiv
              .append("label")
              .attr("class", "form-check-label")
              .attr("for", replace_sep_tokens(prefix.join("_")))
              .html(element);
        }
    }
}

function replace_sep_tokens(s) {
    return s.replace(/#/g, "_").replace(/ /g, "_").replace(/\//g, "_").replace(/=/g, "_").replace(/>/g, "_").replace(/</g, "_"); //.replace("\#", "_");
}

function isLeaf(o) {
    if (typeof o == "number") {
        return true;
    }
    if (typeof o == "string") {
        return true;
    }
    if (typeof o == "boolean") {
        return true;
    }
    return false;
}

function isTable(o, checkleaf=false) {
    rows = Object.keys(o);
    if (rows.length <= 0) {
        return false;
    }
    if (isLeaf(Object.values(o)[0])) {
        return false;
    }
    columns = Object.keys(Object.values(o)[0]);
    columns_set = new Set(columns);
    for (i = 0; i < rows.length; i++) {
        row_columns = Object.keys(o[rows[i]]);
        if (row_columns.length != columns.length) {
            return false;
        }
        for (j = 0; j < row_columns.length; j++) {
            if (!columns_set.has(row_columns[j])) {
                return false;
            }
            if (checkleaf && !isLeaf(o[rows[i]][row_columns[j]])) {
                return false;
            }
        }
    }
    return true;
}
