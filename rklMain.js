loopsPerSecond = 20
// useful preset spells: 'hand of fate', "gambler's fever dream", 'conjure baked goods', 'resurrect abomination'
presetSpellString = "hand of fate"
skipBuildings = false
Grimoire = Game.Objects['Wizard tower'].minigame
pantheon = Game.Objects['Temple'].minigame

function cleanupShimmerTextForLog(input){
	output = input.replace('<br>', '[br]')
	output = output.replace('<div style="font-size:65%;">', '[br]')
	output = output.replace(/(<([^>]+)>)/gi, "")
	return "[COOKIE][br]".concat(output,'[br]')
}

function dynamicStackSize(building) {
	stack = 251
	do {
		stack = stack - 1
	} while ((Game.cookiesPs < building.getSumPrice(stack)) && (stack > 1))
	if (stack > 1) {	
		return stack
	} else {
		return 1
	}
}

function getBuildingStackSize(building) {
	if (isRigidelSlotted()) {
		return (10 - (building.amount % 10))
	} else {
		return dynamicStackSize(building)
	}
}

function determineNextPurchase() {
	upgrade = determineNextUpgrade()
	building = determineNextBuilding()
	stack = getBuildingStackSize(building)
	if (upgrade == -1) {
		out = Game.ObjectsById[building.id]
	} else if ((upgrade.getPrice() < building.price) && (Game.Achievements['Hardcore'].won == 1) && (upgrade !== -1)) {
		out = Game.UpgradesById[upgrade.id]
	} else {
		out = Game.ObjectsById[building.id]
	}
	return out
}

Game.Popup=function(inputText,x,y) {
	if (Game.popups) Game.textParticlesAdd(inputText,0,x,y);
	console.log(cleanupShimmerTextForLog(inputText))
}

function calculatePaybackPeriod(building) {
	stack = getBuildingStackSize(building)
	cost = building.getSumPrice(stack)
	delta = Math.max(building.storedCps,1) * stack
	payback = (Math.max(cost - Game.cookies, 0)/Game.cookiesPsRaw) + cost/delta
	return payback
}

function upgradeIsEligible(upgrade) {
	// Excludes all vaulted upgrades, plus Heavenly Chip Secret and Chocolate Egg
	if (Game.vault.includes(upgrade.id) || (upgrade.id == 129) || (upgrade.id == 227)) {
		return false
	} else {
		if ((upgrade.pool == "") || (upgrade.pool == "cookie") || (upgrade.pool == "kitten") || (upgrade.pool == "tech"))  {
			return true
		} else {
			return false
		}
	}
}

function calculateBankOffset() {
	n = Game.UpgradesById[52].bought + Game.UpgradesById[53].bought + Game.UpgradesById[86].bought + Game.UpgradesById[64].bought + Game.UpgradesById[65].bought + Game.UpgradesById[66].bought + Game.UpgradesById[67].bought + Game.UpgradesById[68].bought + Game.UpgradesById[69].bought + Game.UpgradesById[70].bought + Game.UpgradesById[71].bought + Game.UpgradesById[72].bought + Game.UpgradesById[73].bought
	d = 13
	fm = (60*60*24)
	oexp = 1 + fm**(n/d)
	return (Math.max(Game.cookiesPsRaw,1) * oexp)
}

function getSumWrinklerValue() {
	o = {}
	o.count = 0
	o.total = 0
	o.average = 0
	Game.wrinklers.forEach(function(wrinkler) {
		if (wrinkler.phase == 2) {
			o.count = o.count + 1
			if (o.count > 0) {
				o.total = o.total + wrinkler.sucked
			}
		}
	})
	if (o.count > 1) {
		o.average = o.total / o.count
	} else {
		o.average = o.total
	}
	return o
}

function doWrinklerStuff() {
	o = {}
	i = getSumWrinklerValue()
	o.best = sortWrinklersByValue()
	o.worst = sortWrinklersByValue("worst")
	o.count = i.count
	o.sum = i.total
	o.avg = i.average
	return o
}

function sortWrinklersByValue(mode = "best") {
	var wrinklerValues = []
	Game.wrinklers.forEach(function(wrinkler) {
		if (wrinkler.phase == 2) {
			if (!(wrinkler.type == 0)) {
				wrinklerValues.push({id: wrinkler.id, value: wrinkler.sucked / 100, type: wrinkler.type})
			} else {
				wrinklerValues.push({id: wrinkler.id, value: wrinkler.sucked, type: wrinkler.type})
			}	
		}
	})
	if (wrinklerValues.length > 0) {
		wrinklerValues.sort(function compareFn(a, b) {
			if (mode == "worst") {
				return a.value - b.value
			} else {
				return b.value - a.value
			}
		})
		return Game.wrinklers[wrinklerValues[0].id]
	} else {
		fakeWrinkler = {}
		fakeWrinkler.id = -1
		fakeWrinkler.sucked = 0
		fakeWrinkler.type = -1
		return fakeWrinkler
	}
}

function printWrinklerValue() {
	outstring = ""
	i = doWrinklerStuff()
	c = i.count
	t = i.total
	b = i.best.sucked
	a = i.average
	if (c > 1) {
		outstring = outstring.concat(c," wrinklers worth ",t.toExponential(3)," cookies (",valueInDollars(t),")","[br]Average wrinkler worth ", a.toExponential(3), " cookies (", valueInDollars(a),").[br]","Best wrinkler worth ", b.toExponential(3), " cookies (", valueInDollars(b),")")
	} else if (c == 1) {
		outstring = outstring.concat("One wrinkler worth ",t.toExponential(3)," cookies (",valueInDollars(t),")")
	} else {
		outstring = "No active wrinklers"
	}
	return outstring
}

function convertSecondsToClock(seconds) {
	if (seconds == NaN) {
		output = "not calculable"
		return output
	} else if (seconds < 2) {
		output = "now!"
		return output 
	} else {
		seconds = Math.max(seconds, 0)
		
		sec = (seconds % 60).toString().padStart(2,"0")
		min = Math.max(Math.floor(seconds/60) % 60,0).toString().padStart(2,"0")
		hou = Math.max(Math.floor(seconds/3600) % 24,0).toString().padStart(2,"0")
		day = Math.max(Math.floor(seconds/(60*60*24)),0).toString().padStart(3,"0")

		output = ""

		if (day > 365) {
			output = "more than one year"
		} else {
			output = output.concat(day,":",hou,":",min,":",sec)
		}
		return output
	}
}

function determineNextUpgrade() {
	var availableUpgrades = []
	Game.UpgradesInStore.forEach(function(upgrade){
		if (upgradeIsEligible(upgrade)) {
			availableUpgrades.push({name: upgrade.name, id: upgrade.id, price: upgrade.getPrice()})
		}
	})

	if (availableUpgrades.length > 0) {
		availableUpgrades.sort(function compareFn(a, b) {
			return a.price - b.price
		})
		return Game.UpgradesById[availableUpgrades[0].id]
	} else {
		return -1
	}
}

function determineNextBuilding() {
	var byPayback = []
	var subOneSec = []
	Game.ObjectsById.forEach(function(building){
		if (building.price < Game.cookiesPsRaw) {
			subOneSec.push({name: building.name, id: building.id, price: building.price})
		} else {
			byPayback.push({name: building.name, id: building.id, price: building.price, payback: Math.ceil(calculatePaybackPeriod(building))})
		}
	})
	if (subOneSec.length > 0) {
		subOneSec.sort(function compareFn(a, b) {
			return a.price - b.price
		})
		return Game.ObjectsById[subOneSec[0].id]
	} else {
		byPayback.sort(function compareFn(a, b) {
			return a.payback - b.payback
		})
		return Game.ObjectsById[byPayback[0].id]
	}
}

function valueInDollars(value) {
	return "$".concat((value / Game.cookiesPsRawHighest).toFixed(2))
}

function printBonusMul() {
	value = Game.cookiesPs / Game.cookiesPsRawHighest
	precision = 3
	if (value < (2/(10**precision))) {
		return "Production is stalled"
	} else {
		return "Current production multiplier: ".concat(value.toFixed(precision))
	}
}

function calculatePrestigeDelta() {
	precision = 3
	alltime = Game.cookiesReset + Game.cookiesEarned
	outstring = "[br]Current Prestige Increase: "
	if (Game.heavenlyChips > 0) {
		mode = "magnitude"
		current = (1/Game.HCfactor) * (Math.log10(Game.cookiesReset) - 12)
		next = (1/Game.HCfactor) * (Math.log10(alltime) - 12)	
		delta = next - current
		if (delta < precision) {
			delta = Math.pow(10,delta)
			mode = "multiplier"
		}
		return outstring.concat((delta).toFixed(precision)," (",mode,")")
	} else {
		first = (1/Game.HCfactor) * (Math.log10(alltime) - 12)
		return outstring.concat(Math.pow(10,first).toFixed(precision), " (chips)")
	}
}

function reportNextPurchase(item) {
	i = doWrinklerStuff()
	if (i.count == Game.getWrinklersMax()) {
		wBonus = i.avg
	} else {
		wBonus = 0
	}
	banked = Game.cookies + wBonus
	bankInDollars = valueInDollars(banked)
	if (item.getSumPrice == undefined) {
		price = item.getPrice()
	} else {
		stack = getBuildingStackSize(item)
		price = item.getSumPrice(stack)
	}
	bankOffset = calculateBankOffset()
	targetBank = price + bankOffset
	targetInDollars = valueInDollars(targetBank)
	deficit = banked - targetBank
	deficitInDollars = valueInDollars(deficit)
	timeToNext = convertSecondsToClock(Math.ceil((targetBank - banked)/Game.cookiesPsRaw))
	console.log("[COOKIE][br]Next: ".concat(item.name, " costs ", price.toExponential(3), " cookies[br]",bankInDollars," - ",targetInDollars, " = ",deficitInDollars,"[br]Bank target reached in ", timeToNext, calculatePrestigeDelta(), ".[br]",printBonusMul(),".[br]",printWrinklerValue(),".[br]"))
}

function bankedBuy(item) {
	i = doWrinklerStuff()
	target = calculateBankOffset()
	if (item.getSumPrice == undefined) {
		price = item.getPrice()
	} else {
		stack = getBuildingStackSize(item)
		price = item.getSumPrice(stack)
	}
	if (price < Game.cookiesPsRaw) {
		try {
			item.buy(stack)
		} catch {
			item.click()
		}
	} 
	if (Game.cookies > (price + target)) {
		try {
			item.buy(stack)
		} catch {
			item.click()
		}
	} else if ((i.count == Game.getWrinklersMax()) && ((i.avg + Game.cookies) > (price + target))) {
		i.best.hp = 0
	} else {
		
	}
	return determineNextPurchase()
}

function canCastSpell() {
	if ((Game.Objects['Wizard tower'].level == 0) || (Grimoire.magicM < Grimoire.getSpellCost(Grimoire.spells[presetSpellString]))) {
		return false
	} else {
		return (Grimoire.magic == Grimoire.magicM)
	}
}

function isRigidelSlotted() {
	if ((Game.Objects['Temple'].amount == 0) || (Game.Objects['Temple'].level == 0)) {
		return false
	} else {
		return (pantheon.slot.includes(10))
	}
}

function canClickBigCookie() {
	if (Game.Achievements['Neverclick'].won == 1) {
		if (Game.UpgradesByPool['prestige'][78].bought == 0) { 
				return true
			} else {
			if (Game.UpgradesByPool['toggle'][14].bought == 0) {
				return true
			} else { 
				return false
			}
		}
	} else {
		return false
	}
}

function manageStockPortfolio() {
	if (Game.Objects['Bank'].level > 0) {
		response = false
		i = 0
		var stockPortfolio = []
		market = Game.Objects['Bank'].minigame
		market.goodsById.forEach(function(good){
			if (good.active == true) {
				cookieCost = good.val * Game.cookiesPsRawHighest
				maxStock = market.getGoodMaxStock(good)
				restingVal = Math.max(market.getRestingVal(good.id),100)
				if ((good.val > restingVal) && (good.stock > 20)) {
					market.sellGood(good.id,(good.stock / 2))
				} else if (((Game.cookies - cookieCost) > calculateBankOffset()) && (maxStock > good.stock)) { 
					if (good.val == 1) {
						market.buyGood(good.id,maxStock)
						response = true
					} else if (good.val < (restingVal / 5)) {
						i = i + 1
						stockPortfolio.push({id: good.id, val: good.val})
					} else {
						
					}
				} else {
					
				}
			} else {
				
			}
		})
		
		if (i == 0) {
			return response
		} else {
			stockPortfolio.sort(function compareFn(a, b) {
				return a.val - b.val
			})
			market.buyGood(stockPortfolio[0].id,1)
			return response
		} 
	} else {
		return false
	}
}

function injected_loop()
{
	if (canCastSpell() == true) {
		Grimoire.castSpell(Grimoire.spells[presetSpellString])
	}
	
	if (!(Game.TickerEffect == 0)) {
		Game.tickerL.click()
	}
	manageStockPortfolio()
	nextItem = bankedBuy(nextItem)
	reportNextPurchase(nextItem)
}

function fastLoop() {
	if ((Game.season == "easter") || (Game.season == "halloween")) {
		sortWrinklersByValue("worst").hp = 0
	}
	//TODO:  Check if not Holobore
	Game.shimmers.forEach(function(shimmer) {
		//TODO:  delay until the last 1000 ms 
		shimmer.pop()
	})
	if (canClickBigCookie()) {
		Game.ClickCookie()
	} 
}
nextItem = determineNextPurchase()
setInterval(fastLoop, (1000 / loopsPerSecond));
setInterval(injected_loop, 1000);
