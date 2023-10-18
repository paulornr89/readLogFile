/**
 * @author paulornr
 * 
 * 
 * SCRIPT PARA LER ARQUIVOS DE UM ARQUIVO DE LOG DO SERVIDOR E RECUPERAR OS REGISTROS PERDIDOS DO FLUIG
 * NO PROCESSO DE SOLICITAÇÃO DE EPI
 */

const fs = require('fs');
const { open } = require('node:fs/promises');

//console.log(fs.readFileSync("/server.log.2023-09-30"));

try {
  fs.promises.readdir('./logs')
  .then(async files => {
    console.log(files)
    const epiList = [];

    //LÊ O LOG
    for(file of files){
        if(file.indexOf("server.log") != -1){
            console.log("LOG: " + file);
            await readLog('./logs/' + file, epiList);
        }
    }
    console.log(epiList);
    console.log("TOTAL DE EPIS: "  + epiList.length);
    //GRAVA JSON
    fs.writeFile("logJson.json", JSON.stringify(epiList), err => {
     
        // Checking for errors
        if (err) throw err; 
       
        console.log("Done writing"); // Success
    })
  })
} catch (err) {
  console.error(err);
} 

async function readLog (path , list) {
    const file = await open(path);

    let cont = 0;
    let contLocal = 0;
    let dataSolicitacao = "";
    let codigoEPI = "";
    let codigoMatricula = "";
    let dataEntrega = "";
    let horaEntrega = "";
    let quantidadeEntregue = "";
  
    for await(const line of file.readLines()) {
        if(line.indexOf("Retirada imediata") != -1){
            // console.log(line);
            if(line.indexOf("dataSolicitacao") != -1){
                contLocal += 1;
                dataSolicitacao = getString(line);
            }
            if(line.indexOf("codigoEPI") != -1){
                contLocal += 1;
                codigoEPI = getString(line);           
            }
            if(line.indexOf("codigoMatricula") != -1){
                contLocal += 1;
                codigoMatricula = getString(line);
            }
            if(line.indexOf("dataEntrega") != -1){
                contLocal += 1;
                dataEntrega = getString(line);               
            }
            if(line.indexOf("horaEntrega") != -1){
                contLocal += 1;
                horaEntrega = getString(line);
            }
            if(line.indexOf("quantidadeEntregue") != -1){
                contLocal += 1;
                quantidadeEntregue = getString(line);
            }
            
            if(contLocal == 6) {
                cont += 1;
                if((codigoMatricula.length == 6) && (codigoEPI.length == 8)){
                    list.push({
                        dataSolicitacao: dataSolicitacao,
                        codigoEPI: codigoEPI,
                        descricaoEPI: await getProduto(codigoEPI),
                        codigoMatricula: codigoMatricula,
                        colaborador: await getColaborador(codigoMatricula),
                        dataEntrega: dataEntrega,
                        horaEntrega: horaEntrega,
                        quantidadeEntregue: quantidadeEntregue 
                    })
                }else{
                    console.log("MATRÍCULA OU CÓDIGO ERRADO:");
                    console.log(dataSolicitacao, codigoEPI, codigoMatricula, dataEntrega, horaEntrega, quantidadeEntregue)
                    console.log(cont)
                }             

                contLocal = 0;
                dataSolicitacao = "";
                codigoEPI = "";
                codigoMatricula = "";
                dataEntrega = "";
                horaEntrega = "";
                quantidadeEntregue = "";
            }
        }
    }
    console.log("RETIRADA POR DIA : " + cont)
  }

  function getString(Line){
    const string = Line.substring(Line.indexOf(">"));

    return string.substring(string.indexOf(":") + 1).trim();
  }

function getColaborador(matricula){
    return fetch(`http://localhost:4000/colaborador/${matricula}/0101`)
    .then(response => response.json())
    .then(colaborador => colaborador[0].nome)
    .catch(err => console.log(err))
  }

  function getProduto(codigo){
    return fetch(`http://localhost:4000/fornecedores/consultaProduto/${codigo}`)
    .then(response => response.json())
    .then(produto => produto[0].descricao)
    .catch(err => console.log(err))
  }
