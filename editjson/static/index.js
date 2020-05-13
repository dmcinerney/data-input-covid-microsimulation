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
        if (this.isTable(true)) {
            this.showTableView();
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
    isTable(checkleaf=false){
        var rows = Object.keys(this.viewers);
        if (rows.length <= 0) {
            return false;
        }
        var example_value = this.viewers[rows[0]];
        if (example_value instanceof Param) {
            return false;
        }
        var columns = Object.keys(example_value.viewers);
        var columns_set = new Set(columns);
        for (var i = 0; i < rows.length; i++) {
            var row_obj = this.viewers[rows[i]];
            if (row_obj instanceof Param) {
                return false;
            }
            var row_columns = Object.keys(row_obj.viewers);
            if (row_columns.length != columns.length) {
                return false;
            }
            for (var j = 0; j < row_columns.length; j++) {
                if (!columns_set.has(row_columns[j])) {
                    return false;
                }
                if (checkleaf && !(this.viewers[rows[i]].viewers[row_columns[j]] instanceof Param)) {
                    return false;
                }
            }
        }
        return true;
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
              .html("Table View")
              .on("click", function(){ temp_this.showTableView(); });
        }
        var row = this.container
          .append("table")
          .attr("class", "table table-bordered")
          .append("tbody")
          .selectAll("tr")
          .data(Object.keys(this.viewers).filter(function(e){ return temp_this.viewers[e] instanceof Param; }))
          .enter()
            .append("tr")
        row
          .append("th")
          .attr("scope", "row")
          .html(function(d){ return d; });
        row
          .append("td")
          .attr("class", "cell")
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
    showTableView() {
        this.tabview = false;
        var temp_this = this;
        this.container
          .html("")
          .append("button")
          .attr("class", "btn btn-primary")
          .attr("type", "submit")
          .html("Tab View")
          .on("click", function(){ temp_this.showTabView(); });
        var table = this.container
          .append("table")
          .attr("class", "table table-bordered");
        var column_names = Object.keys(Object.values(this.viewers)[0].viewers);

        table
          .append("thead")
          .append("tr")
          .selectAll("th")
          .data([""].concat(column_names))
          .enter()
            .append("th")
            .attr("scope", "col")
            .html(function(d){ return d; });
        Object.keys(this.viewers).forEach(function(e1){
            var row = table
              .append("tbody")
              .append("tr");
            row
              .append("th")
              .attr("scope", "row")
              .html(e1);
            Object.keys(temp_this.viewers[e1].viewers).forEach(function(e2){
                var cell = row.append("td").attr("class", "cell");
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
                temp_this.json[k] = {"param": v};
                temp_this.viewers[k] = new NumberParam(temp_this.json[k], temp_this, k);
            } else if (typeof v == "string") {
                temp_this.json[k] = {"param": v};
                temp_this.viewers[k] = new StringParam(temp_this.json[k], temp_this, k);
            } else if (typeof v == "boolean") {
                temp_this.json[k] = {"param": v};
                temp_this.viewers[k] = new BooleanParam(temp_this.json[k], temp_this, k);
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
              .attr("value", key);
            input.node().select();
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
    constructor(json, parent=null, name="top") {
        super(json, parent, name);
        this.global_identifier = global_state.getFreshId();
        this.content = null;
    }
    display(parent_div) {
        super.display(parent_div);
        var temp_this = this;
        this.parent_div
          .attr("tabindex", "0")
          .attr("data-trigger", "manual")
          .attr("data-container", "body")
          .attr("data-toggle", "popover")
          .attr("data-placement", "top")
          .attr("data-html", "true")
          .html(this.json["param"]);
        $(this.parent_div.node()).on("focusin.selectParam"+temp_this.global_identifier, function(){ temp_this.select(); });
    }
    deselect() {
        var temp_this = this;
        // $(this.parent_div.node()).off("focusin.deselectParam"+temp_this.global_identifier);
        // $(this.parent_div.node()).off("click.deselectParam"+temp_this.global_identifier);
        $(this.content.node()).off("focusin.deselectParam"+temp_this.global_identifier);
        $(this.content.node()).off("click.deselectParam"+temp_this.global_identifier);
        $(document).off("focusin.deselectParam"+temp_this.global_identifier);
        $(document).off("click.deselectParam"+temp_this.global_identifier);
        // save
        this.savePopoverInfo();
        // destroy
        console.log("deselecting");
        this.parent_div.classed("selected", false);
        $(this.parent_div.node()).popover('dispose');
        this.content.remove();
        $(this.parent_div.node()).on("focusin.selectParam"+temp_this.global_identifier, function(){ temp_this.select(); });
    }
    select() {
        var temp_this = this;
        // open popover
        console.log("selecting cell");
        this.parent_div.classed("selected", true);
        this.setPopoverContent();
        $(this.parent_div.node()).popover({"content":this.content.node()});
        $(this.parent_div.node()).popover('show');
        // handle interactions
        $(this.parent_div.node()).off("focusin.selectParam"+temp_this.global_identifier);
        $(document).on("focusin.deselectParam"+temp_this.global_identifier, function(e){
            console.log("first focusin on document")
            $(document).off("focusin.deselectParam"+temp_this.global_identifier); // ignore the first one;
            // $(temp_this.parent_div.node()).on("focusin.deselectParam"+temp_this.global_identifier, function(e){ console.log("focus on cell"); e.stopPropagation(); });
            $(temp_this.content.node()).on("focusin.deselectParam"+temp_this.global_identifier, function(e){ console.log("focus on popover"); e.stopPropagation(); });
            $(document).on("focusin.deselectParam"+temp_this.global_identifier, function(e){
                console.log("second focusin on document")
                temp_this.deselect();
            });
        });
        // $(this.parent_div.node()).on("click.deselectParam"+temp_this.global_identifier, function(e){ console.log("click on cell"); e.stopPropagation(); });
        $(this.content.node()).on("click.deselectParam"+temp_this.global_identifier, function(e){ console.log("click on popover"); e.stopPropagation(); });
        $(document).on("click.deselectParam"+temp_this.global_identifier, function(e){
            console.log("first click on document");
            $(document).off("click.deselectParam"+temp_this.global_identifier); // ignore the first one;
            $(document).on("click.deselectParam"+temp_this.global_identifier, function(e){
                console.log("second click on document");
                temp_this.deselect();
            });
        });
    }
    setPopoverContent() {
        var temp_this = this;
        this.content = d3.select(d3.select("#cell-popover-template-wrapper").select("div").node().cloneNode(true));
        var input = this.content.append("input")
          .attr("class", "form-control")
          .attr("value", this.json["param"]);
        $(this.parent_div.node()).on("shown.bs.popover", function(){
            input.node().select();
            //taken from https://www.w3schools.com/howto/howto_js_trigger_button_enter.asp
            // Execute a function when the user releases a key on the keyboard
            input.node().addEventListener("keydown", function(event) {
                // Number 13 is the "Enter" key on the keyboard
                if (event.keyCode === 13) {
                    // Cancel the default action, if needed
                    event.preventDefault();
                    // Trigger the button element with a click
                    temp_this.deselect();
                // Number 13 is the "Tab" key on the keyboard
                } else if (event.keyCode === 9) {
                    // Cancel the default action, if needed
                    event.preventDefault();
                    // Trigger the button element with a click
                    temp_this.deselect();
                }
            });
        });
    }
    savePopoverInfo() {
        var value = this.content.select("input").node().value.trim();
        if (value != "") {
            this.json["param"] = value;
            this.parent_div.html(value);
        }
    }
}

class NumberParam extends StringParam {
    setPopoverContent() {
        var temp_this = this;
        this.content = d3.select(d3.select("#cell-popover-template-wrapper").select("div").node().cloneNode(true));
        var select = this.content.append("select")
        var options = ["Number", "Range", "Normal Dist"];
        select.selectAll("option").data(options).enter().append("option")
            .attr("value", function(d){ return d; })
            .html(function(d){ return d; });
        var input = this.content.append("input")
          .attr("class", "form-control")
          .attr("value", this.json["param"]);
        $(this.parent_div.node()).on("shown.bs.popover", function(){
            input.node().select();
            //taken from https://www.w3schools.com/howto/howto_js_trigger_button_enter.asp
            // Execute a function when the user releases a key on the keyboard
            input.node().addEventListener("keydown", function(event) {
                // Number 13 is the "Enter" key on the keyboard
                if (event.keyCode === 13) {
                    // Cancel the default action, if needed
                    event.preventDefault();
                    // Trigger the button element with a click
                    temp_this.deselect();
                // Number 13 is the "Tab" key on the keyboard
                } else if (event.keyCode === 9) {
                    // Cancel the default action, if needed
                    event.preventDefault();
                    // Trigger the button element with a click
                    temp_this.deselect();
                }
            });
        });
    }
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
          .attr("value", this.json["param"])
          .attr("id", checkbox_id)
          .on("click", function(){
              var label = d3.select("#"+checkbox_label_id);
              label.html(!temp_this.json);
              temp_this.json = !temp_this.json;
          });
        checkbox.node().checked = this.json["param"];
        checkdiv
          .append("label")
          .attr("class", "form-check-label")
          .attr("for", checkbox_id)
          .attr("id", checkbox_label_id)
          .html(this.json["param"]);
        // checkdiv
        //   .append("button")
        //   .attr("type", "button")
        //   .attr("class", "btn btn-light")
        //   .html("...");
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

function isChild(x, y){
    // taken from https://stackoverflow.com/questions/17773852/check-if-div-is-descendant-of-another
    while (x = x.parentNode) { 
      if (x.id == "a") return true;
    }
}
