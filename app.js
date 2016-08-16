var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');

var distances = JSON.parse(fs.readFileSync('tsp-distancia.json', 'utf8'));

var app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.listen(3000, () => {
	console.log('App listening on port 3000');
});

app.use(bodyParser.urlencoded({extended: true}));
app.set('json spaces', 4);

//==================================
//== Region to Implement Services ==
//==================================
app.get('/', function (req, res) {
  	res.sendFile(__dirname + '/index.html');
});

app.post('/searchByOrigin', (req, res) => {
  	
	var newList = distances.filter((obj) => {
		return obj.origem.nome == req.body.origem;
	});

	res.json(newList);
});

app.get('/distances', (req, res, next) => {  	
	res.json(distances);
});

app.get('/runSolution', (req, res, next) => {
	res.json(graspHeuristic());
});

app.get('/runGreedySolution', (req, res, next) => {
	res.json(greedySolution());
});

//================================
//==== GRASP Algorithm Region ====
//================================
var greedySolution = function() {
	var cities = JSON.parse(fs.readFileSync('tsp-local.json', 'utf8'));
	var citiesUnvisited = cities;

	var randomPosition = getRandomPosition(0, cities.length);
	var randomCity = cities[randomPosition];	
	var currentVertex = randomCity;

	var result = []

	while (citiesUnvisited.length > 0) {

		citiesUnvisited.every((obj, index) => {
			if(obj.nome == currentVertex.nome) {
				currentVertex = obj;
				result.push(currentVertex);
				citiesUnvisited.splice(index, 1);
				return false;
			}
			else return true;
		});

		var distancesByOrigin = distances.filter((obj) => {
			return obj.origem.nome == currentVertex.nome
					&& citiesUnvisited.some(x => x.nome == obj.destino.nome);;
		});

		//console.log('================================');
		//distancesByOrigin.sort(distanceOrder).forEach(function(obj){ console.log(obj.destino.nome + ': ' + obj.distancia); });
		//console.log('================================');

		var nearestNeighboor = distancesByOrigin.sort(distanceOrder)[0];
		currentVertex = cities.filter((obj) => { return obj.nome == nearestNeighboor.destino.nome })[0];
	}

	//console.log('Término de construção de solução gulosa');
	//console.log('Custo da Solução: ' + calculateCost(result));
	//result.forEach((obj) => { console.log(obj.nome); });

	return result;
};

var localSearch = function(solution) {

	var localSolution = solution;

	for (i = 0; i < solution.length; i++) {
		for (j = 0; j < solution.length; j++) {			
			var cloneSolution = clone(solution);

			var temp = cloneSolution[i];
			cloneSolution[i] = cloneSolution[j];
			cloneSolution[j] = temp;

			if (calculateCost(cloneSolution) < calculateCost(localSolution)) {
				localSolution = cloneSolution;
			}
		}
	}

	return localSolution;
};

var graspHeuristic = function() {
	console.log('starting GRASP solution...');

	var currentSolution;
	var cont = 0;

	while (cont < 100) {
		var randomSolution = greedySolution();
		console.log('Greedy Solution Cost: ' + calculateCost(randomSolution));

		var refinedSolution = localSearch(randomSolution);
		console.log('Local Search Solution Cost: ' + calculateCost(refinedSolution));

		if (cont == 0 || calculateCost(refinedSolution) < calculateCost(currentSolution)) {
			currentSolution = refinedSolution;
			console.log('** Best Solution Found **');
			console.log('New Solution Cost: ' + calculateCost(currentSolution));
		}
		cont++;
	}

	console.log('end of algorithm execution...');
	return currentSolution;
};

//=================================
//== Region to Support Functions ==
//=================================
function getRandomPosition (low, high) {
    return Math.trunc(Math.random() * (high - low) + low);
}

function distanceOrder(a, b) {
  if (parseInt(a.distancia) < parseInt(b.distancia)) return -1;
  if (parseInt(a.distancia) > parseInt(b.distancia)) return 1;
  return 0;
}

function calculateCost(solution) {
	var total = 0;
	for (x = 0; x < solution.length; x++) {
		try {			
			total += getDistance(solution[x], solution[x+1]);
		} catch(err) {
			total += getDistance(solution[x], solution[0]);
		}
	};

	return total;
}

function getDistance(origin, destination) {
	var value = 0;
	distances.forEach((obj) => {
		if(obj.origem.nome == origin.nome 
			&& obj.destino.nome == destination.nome) {
				value = parseInt(obj.distancia);
		}		
	});
	return value;
}

function clone(a) {
   return JSON.parse(JSON.stringify(a));
}