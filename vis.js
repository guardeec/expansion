let width = window.innerWidth*0.7,
    height = window.innerHeight*0.9,
    svg = d3.select("#svg").append("svg")
        .attr("width", width)
        .attr("height", height),
    initFilters = false

function onChange(){
    $( ".d3-tip" ).remove();
    d3.select("svg").remove();
    svg = d3.select("#svg").append("svg")
        .attr("width", width)
        .attr("height", height)
    draw()
}

function draw(){
    $.get( "data/refs", function( refs ) {
        d3.csv("data/data.csv", function(data){

            //UNITE DATA
            refs = refs.split("\n").filter(r=>r.length>0)
            data = data.map(d=>{
                d.ref = refs[refs.indexOf("\\bibitem{ref-" + d.id + "}") + 1].replace("\\emph{", "").split('~').join("")
                return d;
            });

            //START PARAMS
            let nodesSize = 40;
            let simulation = d3.forceSimulation()
                .force("link", d3.forceLink().id(function(d) { return d.id; }))
                .force("charge", d3.forceManyBody().strength(-300))
                .force("center", d3.forceCenter(width / 2, height / 2))
                .force("collide", d3.forceCollide().radius(nodesSize).iterations(2))

            //FILTER DATA
            function filter(data, type){
                return data.filter(d=>{
                    let selected = $("#select"+type).children("option:selected").val();
                    if(selected==="Все") return true
                    return d[type].includes(selected);
                })
            }
            data = filter(data, "model")
            data = filter(data, "area")
            data = filter(data, "task")
            data = data.filter(d=>d.ref.includes($("#selecttag").val()))
            data = data.filter(d=>d.year>=range.value)


            //make data for NODES
            let graph = {nodes:[], links:[]};
            data.forEach(row=>{
                graph.nodes.push({
                    name: row.name,
                    area: row.area,
                    model: row.model.split(";"),
                    doi: row.doi,
                    task:row.task.split("|"),
                    url:row.url,
                    year:row.year,
                    ref:row.ref,
                    id: row.id
                });
            });
            /////////////////make SETS
            let modelsSet = [].concat.apply([],data.map(row=>row.model.split(";")));
            modelsSet = modelsSet.filter((m,index)=>modelsSet.indexOf(m)===index);
            let areaSet = data.map(row=>row.area);
            areaSet = areaSet.filter((a,index)=>areaSet.indexOf(a)===index);
            let taskSet = [].concat.apply([],data.map(row=>row.task.split("|")));
            taskSet = taskSet.filter((m,index)=>taskSet.indexOf(m)===index);
            //make FILTERS if they are not init
            if(!initFilters){
                modelsSet.forEach(model=>$("<option>"+model+"</option>").appendTo( "#selectmodel" ))
                areaSet.forEach(area=>$("<option>"+area+"</option>").appendTo( "#selectarea" ))
                taskSet.forEach(task=>$("<option>"+task+"</option>").appendTo( "#selecttask" ))
                initFilters = true;
            }



            //MAKE CLIQUES
            function makeClique(set, type){
                set.forEach(el=>{
                    nodesToConnect = graph.nodes.filter(node=>node[type].includes(el));
                    for (let s=0; s<nodesToConnect.length-1; s++){
                        for (let t=1; t<nodesToConnect.length; t++){
                            graph.links.push({
                                source: nodesToConnect[s].id,
                                target: nodesToConnect[t].id,
                                type: type
                            });
                        }
                    }
                })
            }
            //FILTER LINKS
            function checkBox(set, type){if($('#links' + type).is(":checked")) makeClique(set, type)}
            checkBox(modelsSet, "model")
            checkBox(areaSet, "area")
            checkBox(taskSet, "task")





            /////////////////////////////////////////////////////////////////////////////////////////////////////////
            //// VISUALIZATION PART
            /////////////////////////////////////////////////////////////////////////////////////////////////////////

            //TIP
            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function(d) {
                    console.log(d)
                    return "<strong>Публикация:</strong> <span style='color:cadetblue'>" + d.name + "</span> " +
                        "<div><strong>Модели:</strong> <span style='color:cadetblue'>" + modelUnmap(d.model) + "</span></div>" +
                        "<div><strong>Область:</strong> <span style='color:cadetblue'>" + d.area + "</span></div>" +
                        "<strong>Задача:</strong> <span style='color:cadetblue'>" + d.task + "</span>"
                })
            svg.call(tip);

            //LINKS
            var link = svg.append("g")
                .attr("class", "links")
                .selectAll("line")
                .data(graph.links)
                .enter().append("line")
                .attr("class", "lines")
                .attr("stroke-width", function(d) { return Math.sqrt(d.value/3); })
                .attr("stroke", "#3e6387")
                .attr("stroke-opacity", 0)

            //NODES
            var node = svg.append("g")
                .attr("class", "nodes")
                .selectAll("g")
                .data(graph.nodes)
                .enter().append("g")

            //LOAD IMAGES
            var nodeImages = node.append("g")
            nodeImages.append('rect')
                .attr('class', 'image-border')
                .attr("x", function(d) { return nodesSize/2*-1;})
                .attr("y", function(d) { return nodesSize/2*-1;})
                .attr('width', nodesSize)
                .attr('height', nodesSize)
                .attr("stroke", "black")
            nodeImages
                .append("svg:image")
                .attr("xlink:href",  function (d) {
                    return "figures/"+d.id+".png"
                    //return "figures/"+d.id+".png"
                })
                .attr("x", function(d) { return nodesSize/2*-1;})
                .attr("y", function(d) { return nodesSize/2*-1;})
                .attr("height", nodesSize)
                .attr("width", nodesSize)
                ////////////////////////////////////
                //////////////////////////////////////////////SHOW AND HIDE links
                .on("mouseover", function (node) {
                    tip.show(node);
                    svg.selectAll(".lines").attr("stroke-opacity", function (link) {
                        if(link.source === node || link.target === node){ return 1}
                        return 0
                    })
                })
                .on('mouseout', function (node) {
                    tip.hide(node);
                    svg.selectAll(".lines").attr("stroke-opacity", function (link) {
                        return 0
                    })
                })
                ////////////////////////////////////
                //////////////////////////////////////////////MAKE DETAILS ON DEMAND
                .on('click',function (d) {
                    $("#articleInfo").empty();
                    $("#articleInfo").html(
                        "<div class='row'>"+
                        "<div style='text-align: center; padding-bottom: 20px'><strong style='font-size: 120%'>Публикация:</strong> <span style='color:cadetblue;font-size: 120%'>" + d.name + "</span> </div>" +
                        "<div class='columnLeft'>" +
                        "<img width='100%' border='1'  src='figures/"+d.id+".png' alt='"+d.name+"'>"+
                        "</div>"+
                        "<div class='columnRight'>" +
                        "<div style='padding-left: 20px; padding-top: 10px'><strong>Модели:</strong> <span style='color:cadetblue'>" + modelUnmap(d.model) + "</span></div>" +
                        "<div style='padding-left: 20px'><strong>Область:</strong> <span style='color:cadetblue'>" + d.area + "</span></div>"+
                        "<div style='padding-left: 20px'><strong>Задача:</strong> <span style='color:cadetblue'>" + d.task + "</span></div>" +
                        "<div style='padding-left: 20px'><strong>Год:</strong> <span style='color:cadetblue'>" + d.year + "</span></div>" +
                        "<div style='padding-left: 20px; padding-top: 10px'><strong>DOI:</strong> <span style='color:cadetblue'>" + d.doi + "</span></div>" +
                        "<div style='padding-left: 20px; padding-top: 25px; '><i><span style='color: cadetblue'>"+d.ref.split("}")[0]+" </span>"+d.ref.split("}")[1]+"</i></div>" +
                        "<div style='text-align: center; padding-top: 10px'>" +
                            "<a href='"+d.url+"'>"+
                                "<button onclick='location.href="+d.uri+"'>url</button>" +
                            "</a>"+
                        "</div>"+
                        "</div>"+
                        "</div>"
                    )
                    console.log(d.url)
                    modal.style.display = "block";
                })

            //WILL BE REMOVED
            function modelUnmap(short){
                function unmap(name) {
                    switch (name) {
                        case "Graph": return "Граф";
                        case "TreeMap": return "Карта деревьев";
                        case "Matrix": return "Матрица";
                        case "Tree": return "Дерево";
                        case "Chart": return "Простейшний график";
                        case "Parallel coordinates": return "Параллельные коррдинаты";
                        case "Scatter plot": return "График рассеивания";
                        case "Chord Diagram": return "Хордовая диаграмма";
                        case "Word cloud": return "Облако слов";
                        case "Geographical maps": return "Гео-карта";
                        case "HeatMap": return "Тепловая карта";
                        case "Streamgraph": return "График потока";
                    }
                }
                return  short.map(unmap);
            }

            //START FORCE
            simulation
                .nodes(graph.nodes)
                .on("tick", ticked);
            simulation.force("link")
                .links(graph.links);
            function ticked() {
                node
                    .attr("transform", function(d) {
                        d.x = Math.max(nodesSize, Math.min(width - nodesSize, d.x));
                        d.y = Math.max(nodesSize, Math.min(height - nodesSize, d.y));
                        return "translate(" + d.x + "," + d.y + ")";
                    })
                link
                    .attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });
            }
        });
    });
}

draw();