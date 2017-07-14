function CustomAbilities:RandomOMGRollAbilities(unit)
	if Options:IsEquals("EnableRandomAbilities") then
		local ability_count = 6
		local ultimate_count = 2
		for i = 0, unit:GetAbilityCount() - 1 do
			local ability = unit:GetAbilityByIndex(i)
			if ability then
				for _,v in ipairs(unit:FindAllModifiers()) do
					if v:GetAbility() and v:GetAbility() == ability then
						v:Destroy()
					end
				end
				unit:RemoveAbility(ability:GetName())
			end
		end

		local has_abilities = 0
		while has_abilities < ability_count - ultimate_count do
			local abilityTable = CustomAbilities.RandomOMG.Abilities[RandomInt(1, #CustomAbilities.RandomOMG.Abilities)]
			local ability = abilityTable.ability
			if ability and not unit:HasAbility(ability) then
				PrecacheItemByNameAsync(ability, function() end)
				GameMode:PrecacheUnitQueueed(abilityTable.hero)
				unit:AddNewAbility(ability)
				has_abilities = has_abilities + 1
			end
		end
		local has_ultimates = 0
		while has_ultimates < ultimate_count do
			local abilityTable = CustomAbilities.RandomOMG.Ultimates[RandomInt(1, #CustomAbilities.RandomOMG.Ultimates)]
			local ability = abilityTable.ability
			if ability and not unit:HasAbility(ability) then
				PrecacheItemByNameAsync(ability, function() end)
				GameMode:PrecacheUnitQueueed(abilityTable.hero)
				unit:AddNewAbility(ability)
				has_ultimates = has_ultimates + 1
			end
		end
		unit:ResetAbilityPoints()
	end
end
