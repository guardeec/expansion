let width = window.innerWidth*0.7,
    height = window.innerHeight*0.9,
    svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height)

let nodesSize = 40;

let simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide().radius(nodesSize).iterations(2))

d3.csv("data.csv", function(data){
    let graph = {nodes:[], links:[]};
    //data.forEach((d,i)=>console.log(d.area,i))

    //make data for NODES
    data.forEach(row=>{
       graph.nodes.push({
           name: row.name,
           area: row.area,
           model: row.model.split(";"),
           id: row.id
       });
    });

    //make data for model LINKS
    let modelsSet = [].concat.apply([],data.map(row=>row.model.split(";")));
    modelsSet = modelsSet.filter((m,index)=>modelsSet.indexOf(m)===index);
    //make a clique for each model
    modelsSet.forEach(model=>{
       let nodesToConnect = graph.nodes.filter(node=>node.model.includes(model));
       for (let s=0; s<nodesToConnect.length-1; s++){
           for (let t=1; t<nodesToConnect.length; t++){
               graph.links.push({
                  source: nodesToConnect[s].id,
                  target: nodesToConnect[t].id,
                  type: "model",
                  model: model,
                  area: null,
                  value: nodesSize
               });
           }
       }
    });


    //make data for area LINKS
    let areaSet = data.map(row=>row.area);
    areaSet = areaSet.filter((a,index)=>areaSet.indexOf(a)===index);
    //make a clique for each area
    areaSet.forEach(area=>{
        let nodesToConnect = graph.nodes.filter(node=>node.area===area);
        for (let s=0; s<nodesToConnect.length-1; s++){
            for (let t=s; t<nodesToConnect.length; t++){

                graph.links.push({
                    source: nodesToConnect[s].id,
                    target: nodesToConnect[t].id,
                    type: "area",
                    model: null,
                    area: area,
                    value: nodesSize//*5
                });
            }
        }
    });

    console.log(modelsSet);
    console.log(areaSet);


    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    //// VISUALIZATION PART
    /////////////////////////////////////////////////////////////////////////////////////////////////////////

    //////////////////////////////////////////////////////////// TIP
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            console.log(d)
            return "<strong>Публикация:</strong> <span style='color:cadetblue'>" + d.name + "</span> " +
                "<div><strong>Модели:</strong> <span style='color:cadetblue'>" + modelUnmap(d.model) + "</span></div>" +
                "<strong>Область:</strong> <span style='color:cadetblue'>" + areaUnmap(d.area) + "</span>"
        })
    svg.call(tip);

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
        .attr("class", "lines")
        .attr("stroke-width", function(d) { return Math.sqrt(d.value/3); })
        .attr("stroke", "#3e6387")
        .attr("stroke-opacity", 0)

    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(graph.nodes)
        .enter().append("g")



    var nodeImages = node.append("g")


    nodeImages.append('rect')
        .attr('class', 'image-border')
        .attr("x", function(d) { return nodesSize/2*-1;})
        .attr("y", function(d) { return nodesSize/2*-1;})
        .attr('width', nodesSize)
        .attr('height', nodesSize)
        .attr("stroke", "black")

    nodeImages
        //////////////////////////////////////////////image
        .append("svg:image")
        .attr("xlink:href",  function (d) {
            return "figures/"+d.id+".png"
            //return "figures/"+d.id+".png"
        })
        .attr("x", function(d) { return nodesSize/2*-1;})
        .attr("y", function(d) { return nodesSize/2*-1;})
        .attr("height", nodesSize)
        .attr("width", nodesSize)


        //////////////////////////////////////////////show links
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
                        "<div style='padding-left: 20px'><strong>Область:</strong> <span style='color:cadetblue'>" + areaUnmap(d.area) + "</span></div>"+
                        "<div style='padding-left: 20px'><strong>Задача:</strong> <span style='color:cadetblue'>" + "Бинарное представление зловредов" + "</span></div>" +
                        "<div style='padding-left: 20px'><strong>Год:</strong> <span style='color:cadetblue'>" + 2018 + "</span></div>" +

                        "<div style='padding-left: 20px; padding-top: 10px'><strong>DOI:</strong> <span style='color:cadetblue'>" + "10.1109/VIZSEC.2018.8709231" + "</span></div>" +


                        "<div style='padding-left: 20px; padding-top: 25px; '><i><span style='color: cadetblue'>Donahue J., Paturi A., Mukkamala S. </span>Visualization techniques for efficient malware detection //2013 IEEE International Conference on Intelligence and Security Informatics. – IEEE, 2013. – P. 289-291.</i></div>" +
                        "<div style='text-align: center; padding-top: 10px'><button>BibTeX</button></div>"+

                    "</div>"+
                "</div>"
            )
            modal.style.display = "block";
        })

    console.log(modelsSet)
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

     "Parallel Coordinates", "Streamgraph"

    function areaUnmap(short){
        switch (short) {
            case "AC": return "Контроль доступа";
            case "DLP": return "Предотвращение утечек";
            case "NET": return "Сетевая безопасность";
            case "FOR": return "Криминалистика";
            case "RISK": return "Анализ рисков";
            case "SOC": return "Социальные сети";
            case "VIR": return "Вирусология";
        }
    }




    // .call(d3.drag()
        //     .on("start", dragstarted)
        //     .on("drag", dragged)
        //     .on("end", dragended));

    // var lables = node.append("text")
    //     .text(function(d) {
    //         return d.id;
    //     })
    //     .attr('x', 6)
    //     .attr('y', 3);

    // node.append("title")
    //     .text(function(d) { return d.id; });

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

// function dragstarted(d) {
//     if (!d3.event.active) simulation.alphaTarget(0.3).restart();
//     d.fx = d.x;
//     d.fy = d.y;
// }
//
// function dragged(d) {
//     d.fx = d3.event.x;
//     d.fy = d3.event.y;
// }
//
// function dragended(d) {
//     if (!d3.event.active) simulation.alphaTarget(0);
//     d.fx = null;
//     d.fy = null;
// }