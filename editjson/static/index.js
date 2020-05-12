var json_viewer = null;
var selected_param = null;
class GlobalState {
    constructor() {
        this.max_global_id = 0;
        this.global_id_holes = new Set([]);
    }
    removeId(id) {
        id = id.slice("global_state_".length);
        this.global_id_holes.add(id);
    }
    getFreshId() {
        if (this.global_id_holes.size > 0) {
            var id = this.global_id_holes.values().next().value;
            this.global_id_holes.delete(id);
        } else {
            var id = this.max_global_id;
            this.max_global_id += 1;
        }
        return "global_state_"+id;
    }
}
var global_state = new GlobalState();

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
    constructor(json, parent=null, name="top") {
        this.json = json;
        this.parent = parent;
        this.name = name;
        this.parent_div = null; // set when display is called
        this.container = null; // set when display is called
        this.recurse();
    }
    recurse() {
    }
    display(parent_div) {
        this.parent_div = parent_div.html("");
    }
    rename(newname) {
        this.name = newname;
    }
    prefix() {
        var prefix = [this.name];
        if (this.parent != null) {
            prefix = this.parent.prefix().concat(prefix);
        }
        return prefix;
    }
}

class JSONNonLeaf extends JSONViewer {
    recurse() {
        this.viewers = {}; // stores all sub views
        this.elements = {}; // stores any elements that need to be referenced
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
    isTable(){
        return false; //TODO: implement this
    }
    showTabView(){
        var temp_this = this;
        this.tabview = true;
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
          .attr("class", "container grid-container kvlist")
          .selectAll("div")
          .data(Object.keys(this.viewers).filter(function(e){ return temp_this.viewers[e] instanceof Param; }))
          .enter()
            .append("div")
            .attr("class", "row");
        kv_pair_div
          .append("div")
          .attr("class", "col-sm")
          .html(function(d){ return d; });
        kv_pair_div
          .append("div")
          .attr("class", "col-sm keys")
          .each(function(d){ temp_this.viewers[d].display(d3.select(this)); });

        var tabs = Object.keys(this.viewers).filter(function(e){ return temp_this.viewers[e] instanceof JSONNonLeaf; });
        var ids = {};
        tabs.forEach(function(t){
            ids[t] = [global_state.getFreshId(), global_state.getFreshId()];
        });

        var tabitems = this.container
          .append("ul")
          .attr("class", "nav nav-tabs")
          .selectAll("li")
          .data(tabs)
          .enter()
            .append("li")
            .attr("id", function(d){ return ids[d][0]; })
            .attr("class", "nav-item")
            .each(function(d){ temp_this.elements[d+"_tab"] = this; })
            .append("a")
            .attr("class", "nav-link")
            .attr("data-toggle", "tab")
            .attr("href", function(d){ return "#"+ids[d][1]; })
            .html(function(d){ return d; });

        var tab_content_wrapper = this.container
          .append("div")
          .attr("class", "tab-content")
          .selectAll("div")
          .data(tabs)
          .enter()
            .append("div")
            .attr("id", function(d){ return ids[d][1]; })
            .attr("class", "tab-pane fade")
            .each(function(d){ temp_this.viewers[d].display(d3.select(this)); });
    }
    showGridView() {
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
        var columns = Object.keys(Object.values(this.viewers)[0]);

        grid_container
          .append("div")
          .attr("class", "row")
          .selectAll("div")
          .data([""].concat(columns))
          .enter()
            .append("div")
            .attr("class", "col-sm")
            .html(function(d){ return d; });
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
            if (v == null) {
                temp_this.viewers[k] = null;
            } else if (typeof v == "number") {
                temp_this.viewers[k] = new NumberParam(v, temp_this, k);
            } else if (typeof v == "string") {
                temp_this.viewers[k] = new StringParam(v, temp_this, k);
            } else if (typeof v == "boolean") {
                temp_this.viewers[k] = new BooleanParam(v, temp_this, k);
            } else if (Array.isArray(v)) {
                temp_this.viewers[k] = new JSONList(v, temp_this, k);
            } else {
                temp_this.viewers[k] = new JSONDictionary(v, temp_this, k);
            }
        });
    }
    showTabView() {
        super.showTabView();
        var temp_this = this;
        this.container
          .select(".nav")
          .selectAll(".nav-item")
          .select("a")
          .on("dblclick", function(){ temp_this.editKeyName(d3.select(this).html()); });
    }
    editKeyName(key) {
        var temp_this = this;
        if (this.tabview && (key in this.viewers) && (this.viewers[key] instanceof JSONNonLeaf)) {
            var tab = d3.select(this.elements[key+"_tab"]);
            tab.select("a").classed("hide", true);
            var input = tab
              .append("input")
              .attr("class", "form-control")
              .attr("placeholder", key);
            $(input.node()).on("click", function(){ return false; });
            $(document).on("click.forChangeKeyName", function(){
                temp_this.changeKeyName(key, input.node().value);
                $(document).off("click.forChangeKeyName");
            });
            //taken from https://www.w3schools.com/howto/howto_js_trigger_button_enter.asp
            // Execute a function when the user releases a key on the keyboard
            input.node().addEventListener("keyup", function(event) {
                // Number 13 is the "Enter" key on the keyboard
                if (event.keyCode === 13) {
                    // Cancel the default action, if needed
                    event.preventDefault();
                    // Trigger the button element with a click
                    temp_this.changeKeyName(key, input.node().value);
                }
            });
        } else { // may not need any other cases
        }
    }
    changeKeyName(key, newname){
        var temp_this = this;
        newname = newname.trim();
        if (this.tabview && (key in this.viewers) && (this.viewers[key] instanceof JSONNonLeaf)) {
            var tab = d3.select(this.elements[key+"_tab"]);
            tab.select("input").remove();
            var a = tab.select("a");
            console.log(key);
            console.log(newname);
            a.classed("hide", false);
            if (newname == "" || key == newname) { return; }
            a.html(newname);

            //bookkeeping
            changeKey(this.json, key, newname);
            changeKey(this.viewers, key, newname);
            this.viewers[newname].rename(newname);
        } else { // may not need any other cases
        }
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
          .on("click", function(){ openDetails(temp_this.prefix()); });
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
        var checkbox_id = global_state.getFreshId();
        var checkbox_label_id = global_state.getFreshId();
        var checkbox = checkdiv
          .append("input")
          .attr("class", "form-check-input")
          .attr("type", "checkbox")
          .attr("value", this.json)
          .attr("id", checkbox_id)
          .on("click", function(){
              var label = d3.select("#"+checkbox_label_id);
              label.html(!temp_this.json);
              temp_this.json = !temp_this.json;
          });
        checkbox.node().checked = this.json;
        checkdiv
          .append("label")
          .attr("class", "form-check-label")
          .attr("for", checkbox_id)
          .attr("id", checkbox_label_id)
          .html(this.json);
        checkdiv
          .append("button")
          .attr("type", "button")
          .attr("class", "btn btn-light")
          .html("...")
          .on("click", function(){ openDetails(temp_this.prefix()); });
    }
}

function changeKey(dictionary, originalname, newname){
    dictionary[newname] = dictionary[originalname];
    delete dictionary[originalname];
}

function getViewerNode(prefix){
    prefix = prefix.slice(1);
    var curr = json_viewer;
    for (var i = 0; i < prefix.length; i++) {
        curr = curr.viewers[prefix[i]];
    }
    return curr;
}

function openDetails(prefix) {
    selected_param = prefix;
    console.log(prefix);
    var value = getViewerNode(prefix);
    var param_details = d3.select("body").select("#param-details").classed("hide", false);
    param_details.select("#param-prefix")
      .html(prefix.join(" / "));
    onSelectType();
}

function onSelectType() {
    var value = getViewerNode(selected_param);
    console.log(value);
    var type = d3.select("#param-type").node().value;
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
