loopsPerSecond = 20

function calculatePaybackPeriod(building) {
	cost = building.price
    if (building.count == 0) {
        cost = cost / 500
    } else if (building.count < 300) {
		cost = cost / (500 - building.count)
	}
	delta = Math.max(building.storedCps,1)
	payback = (Math.max(cost - Game.cookies, 0)/Game.cookiesPsRaw) + cost/delta
	return payback
}

function upgradeIsEligible(upgrade) {
	if (Game.vault.includes(upgrade.id)) {
		return false
	} else {
		if ((upgrade.pool == "") || (upgrade.pool == "cookie") || (upgrade.pool == "kitten")) {
			return true
		} else if ((upgrade.pool == "tech") && (upgrade.id < 71)) {
			return true
		} else {
			return false
		}
	}
}

function calculateBankOffset() {
	bank = Game.cookies
	cps = Math.max(Game.cookiesPsRaw,1)
		
	if ((Game.Upgrades["Lucky day"].bought == 0) || (Game.Upgrades["Serendipity"].bought == 0)) {
		//console.log("bank offset is in simple mode")
		return cps
	} else {
		if (Game.Upgrades["One mind"].bought == 0) {
			//console.log("bank offset is in lucky mode")
			return cps * 6000
		}
		else {
			//console.log("bank offset is in frenzy lucky mode")
			return cps * 42000
		}
	}
}

function calculateUpgradePayback(upgrade) {
	// this function is not yet properly implemented
	// need to see if I can pull the delta directly from the game
	// if I can't pull the delta directly from the game, then stick with this approximation
	return (Math.max(upgrade.basePrice - Game.cookies, 0) / Game.cookiesPsRaw)
}

function convertSecondsToClock(seconds) {
	seconds = Math.max(seconds, 0)
	if (seconds == NaN) {
		output = "not calculable"
		return output
	}
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

function determineNextUpgrade() {
	var availableUpgrades = []
	Game.UpgradesInStore.forEach(function(upgrade){
		if (upgradeIsEligible(upgrade)) {
			availableUpgrades.push({name: upgrade.name, id: upgrade.id, price: upgrade.basePrice, payback: calculateUpgradePayback(upgrade)})
		}
	})

	if (availableUpgrades.length > 0) {
		availableUpgrades.sort(function compareFn(a, b) {
			return a.price - b.price
		})
		return availableUpgrades[0]
	} else {
		return -1
	}
}

function determineNextBuilding() {
	var selection = []
	var byPayback = []
	var subOneSec = []
	Game.ObjectsById.forEach(function(building){
		byPayback.push({name: building.name, id: building.id, price: building.price, payback: Math.ceil(calculatePaybackPeriod(building))})
		if (building.price < Game.cookiesPsRaw) {
			subOneSec.push({name: building.name, id: building.id, price: building.price, payback: Math.ceil(calculatePaybackPeriod(building))})
		}
	})
	byPayback.sort(function compareFn(a, b) {
		return a.payback - b.payback
	})
	selection.push(byPayback[0])
	
	if (subOneSec.length > 0) {
		subOneSec.sort(function compareFn(a, b) {
			return a.price - b.price
		})
		selection.push(subOneSec[0])
	}
		
	selection.sort(function compareFn(a, b) {
		return a.price - b.price
	})

	return selection[0]
}

function reportNextPurchase(next) {
	bankOffset = calculateBankOffset()
	costInTime = convertSecondsToClock(Math.ceil(next.price / Game.cookiesPsRaw))
    costInDollars = "$".concat((next.price / Game.cookiesPsRawHighest).toFixed(2))
	paybackTime = convertSecondsToClock(next.payback)
	bankThreshold = next.price + bankOffset
	timeToNext = convertSecondsToClock(Math.ceil((bankThreshold - Game.cookies)/Game.cookiesPs))
	console.log("\nNext: ".concat(next.name, " costs ", next.price.toExponential(3), " cookies (",costInDollars, ") paid back in ",paybackTime,".\nBank carries ",Game.cookies.toExponential(3)," cookies.  Bank target (",bankThreshold.toExponential(3),") reached in ", timeToNext, ".\n"))
}

function determineNextPurchase() {
	building = determineNextBuilding()
	if ((Game.UpgradesOwned > 0) || (Game.Achievements['Hardcore'].won == 1)) {
		upgrade = determineNextUpgrade()
		if (upgrade == -1) {
			reportNextPurchase(building)
			return Game.ObjectsById[building.id]
		} else if (upgrade.price < building.price) {
			reportNextPurchase(upgrade)
			return Game.UpgradesById[upgrade.id]
		} else {
			reportNextPurchase(building)
			return Game.ObjectsById[building.id]
		}
	} else {
		reportNextPurchase(building)
		return Game.ObjectsById[building.id]
	}
}

nextItem = determineNextPurchase()

function bankedBuy(bankValue, item) {
	target = calculateBankOffset()
	if (item.price == undefined) {
		price = item.basePrice
	} else {
		price = item.price
	}
	if((bankValue - price) >= target) {
		try {
			item.click()
		} catch {
			item.buy()
		}
		return determineNextPurchase()
	} else {
		return item
	}
}

function getMaxWrinklerCount() {
	output = 10
	// if prestige upgrade
	if (true) {
		output = output + 2
	}
	// if You aura
	if (false) {
		output = output + 2
	}
	return output
}

function logic_loop()
{
	luckyValue = Game.cookies

	Game.shimmers.forEach(function(shimmer) {
		shimmer.pop()
		console.log("\nShimmer popped!\n")
        nextBuilding = determineNextBuilding()
	})
	
    /* Bank stuff
    Game.Objects['Bank']['minigame']['goods'].forEach(function(good) {
        if (good.val == 1) {
            Game.Objects['Bank']['minigame'].buyGood(good.id, 1)
        }
    }
	
	Wrinklers stuff
	if have max Wrinklers
		sort wrinklers by reward
		pop most valuable wrinkler
	*/
	
	

	if (Game.Achievements['Neverclick'].won == 1) {
		if (Game.UpgradesByPool['prestige'][78].bought == 0) { 
				Game.ClickCookie()
			} else {
			if (Game.UpgradesByPool['toggle'][14].bought == 0) {
				Game.ClickCookie()
			}
		}
	} 

    if (Game.ObjectsById[0].amount < 20) {
        thisItem = Game.ObjectsById[0]
    } else {
    	thisItem = nextItem
    }
	
	nextItem = bankedBuy(luckyValue, thisItem)
}

setInterval(function() {
	logic_loop()
}, (1000 / loopsPerSecond));
