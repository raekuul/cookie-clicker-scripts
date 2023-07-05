function calculatePaybackPeriod(building) {
	// use the Cookie Monster payback period calculation
}


function determineNextPurchase() {
	var buildings = [];
	Game.ObjectsById.forEach(function(building){
		buildings.push({id: building.id, price: building.price, amount: building.amount, payback: calculatePaybackPeriod(building)})
	})
	// building A is lowest payback period
	// building B is cheapest building with 0 built
	// return id of cheaper of A or B
	if (count.price < payback.price) {
		return count.id
	} else if (count.price >= payback.price) {
		return payback.id
	} else {
		console.log("Called determineNextPurchase, but function is incomplete.")
		return -1
	}
}

nextBuilding = determineNextPurchase()

function unbankedSmarterBuyBuilding(building) {
	if (Game.cookies > building.price) {
		Game.ObjectsById[building.id].buy()
		return building.id
	} else {
		return determineNextPurchase()
	}
}

function bankedSmarterBuyBuilding(bankValue, target, building) {
	if((building.price < Game.cookiesPs) || ((building.amount == 0) && (Game.cookies > building.price)) || ((bankValue - building.price) > (target))) {
		Game.ObjectsById[building.id].buy()
		return building.id
	} else {
		return determineNextPurchase()
	}
}

function unbankedBuyBuilding(){
	var buildings = [];
	Game.ObjectsById.forEach(function(building){
		if((building.price < Game.cookiesPs) || (Game.cookies > building.price)) {
			buildings.push({id: building.id, price: building.price});
		}});
	if(buildings.length > 0) Game.ObjectsById[buildings.sort(function(a, b){return a.price-b.price})[0].id].buy();
}

function bankedBuyBuilding(bankValue, target) {
	var buildings = [];
	Game.ObjectsById.forEach(function(building){
		if((building.price < Game.cookiesPs) || ((building.amount == 0) && (Game.cookies > building.price)) || ((bankValue - building.price) > (target)))
			buildings.push({id: building.id, price: building.price});
	});
	if(buildings.length > 0) Game.ObjectsById[buildings.sort(function(a, b){return a.price-b.price})[0].id].buy();
}

function logic_loop()
{
	if (Game.cookiesPsRawHighest == 0) {
		liquidAssets = 0
	} else {
		liquidAssets = Game.cookies / Game.cookiesPsRawHighest
	}
	luckyValue = Game.cookies * 0.15
	luckyBankTarget = Game.cookiesPsRawHighest * 60 * 15
	frenzyBankTarget = luckyBankTarget * 7
	
	Game.shimmers.forEach(function(shimmer) {
		shimmer.pop()
	})
	if (Game.Upgrades["Shimmering veil [on]"].bought == 1) {
		Game.ClickCookie()
	}
	if ((Game.Upgrades["Lucky day"].bought == 0) && (Game.Upgrades["Serendipity"].bought == 0)) {
		if (Game.hasBuff('Frenzy') == 0) {
			unbankedBuyBuilding()
		}
	} else {
		if (Game.Upgrades["One mind"].bought == 0) {
			bankedBuyBuilding(luckyValue, luckyBankTarget)
		}
		else {
			bankedBuyBuilding(luckyValue, frenzyBankTarget)
		}
	}
}

setInterval(function() {
	logic_loop()
}, 100);
