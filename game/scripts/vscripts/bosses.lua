if Bosses == nil then
	Bosses = class({})
end

function Bosses:InitAllBosses()
	for i = 2,3 do
		--[[Bosses:CreateBossPortal("fire", i)
		Bosses:CreateBossPortal("water", i)
		Bosses:CreateBossPortal("earth", i)
		Bosses:CreateBossPortal("wind", i)
		Bosses:CreateBossPortal("primal", i)]]
	end
	Bosses:SpawnStaticBoss("heaven")
	Bosses:SpawnStaticBoss("hell")
	--Bosses:SpawnStaticBoss("roshan")
end

function IsBossEntity(unit)
	return string.find(unit:GetUnitName(), "npc_dota_boss_")
end

function Bosses:SpawnStaticBoss(name)
	Bosses:MakeBossAI(CreateUnitByName("npc_dota_boss_" .. name, Entities:FindByName(nil, "target_mark_bosses_" .. name):GetAbsOrigin(), true, nil, nil, DOTA_TEAM_NEUTRALS), name)
end

function Bosses:RegisterKilledBoss(unitname, team)
	local bossname = string.sub(unitname, 15)
	Notifications:TopToAll({text="#" .. unitname})
	Notifications:TopToAll({text="#bosses_killed_p1", continue=true})
	Notifications:TopToAll(CreateTeamNotificationSettings(team, true))
	Notifications:TopToAll({text="#bosses_killed_p2", continue=true})
	local amount = BOSSES_SETTINGS[bossname].gold_overall
	local p1, p2 = CreateGoldNotificationSettings(amount)
	Notifications:TopToAll(p1)
	Notifications:TopToAll(p2)
	for _,v in ipairs(GetPlayersInTeam(team)) do
		Gold:ModifyGold(v, amount)
	end
	Timers:CreateTimer(BOSSES_SETTINGS[bossname].RespawnTime, function()
		Bosses:SpawnStaticBoss(bossname)
	end)
end

function Bosses:MakeBossAI(unit, name)
	unit:SetIdleAcquire(false)
	local aiTable = {
		leashRange = 1600,
	}
	--[[if name == "roshan" then
		local boss_roshan_spikes = unit:FindAbilityByName("boss_roshan_spikes")
		aiTable["abilityCastCallback"] = function(self)
			local unitsInRange = self:FindUnitsNearby(boss_roshan_spikes:GetAbilitySpecial("length") - 200, false, true, DOTA_UNIT_TARGET_HERO)
			if #unitsInRange > 0 then
				local spikesTarget
				for _,v in ipairs(unitsInRange) do
					if v:GetHealth() <= boss_roshan_spikes:GetAbilityDamage() then
						spikesTarget = v
					end
				end
				if not spikesTarget then
					spikesTarget = unitsInRange[RandomInt(1, #unitsInRange)]
				end
				if spikesTarget then
					self:UseAbility(boss_roshan_spikes, spikesTarget:GetAbsOrigin())
				end
			end
		end
	end]]
	local ai = SimpleAI:new(unit, "boss", aiTable)
end