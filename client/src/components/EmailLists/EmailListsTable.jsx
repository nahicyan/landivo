import React from "react";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Mail, 
  PlusCircle, 
  Trash2, 
  Edit, 
  Users,
  UserPlus,
  X
} from "lucide-react";

// Define the list table component
export default function EmailListsTable({ 
  lists, 
  searchQuery, 
  onSearchChange, 
  clearSearch,
  resultCount = 0,
  totalCount = 0,
  sourceOptions = ["all"],
  sourceFilter = "all",
  onSourceChange = () => {},
  includeGenerated = false,
  onIncludeGeneratedChange = () => {},
  showBuyerFilters = false,
  useBuyerFilters = false,
  onUseBuyerFiltersChange = () => {},
  buyerFilters,
  onBuyerFiltersChange = () => {},
  onNewList, 
  onEditList, 
  onEmailList, 
  onAddBuyers, 
  onManageMembers, 
  onDeleteList 
}) {
  const filters = buyerFilters || {
    mode: "and",
    rules: [],
    advanced: { enabled: false, groups: [] }
  };

  const buyerTypeOptions = [
    "CashBuyer",
    "Builder",
    "Developer",
    "Realtor",
    "Investor",
    "Wholesaler"
  ];

  const matchOptions = [
    { value: "contains-any", label: "Contains any" },
    { value: "contains-all", label: "Contains all" },
    { value: "exact", label: "Exact match" }
  ];

  const baseRules = Array.isArray(filters.rules) ? filters.rules : [];
  const advancedEnabled = Boolean(filters.advanced?.enabled);
  const advancedGroups = Array.isArray(filters.advanced?.groups) ? filters.advanced?.groups || [] : [];

  const getRule = (rules, field) => (rules || []).find((rule) => rule.field === field);

  const upsertRule = (rules, nextRule) => {
    const nextRules = Array.isArray(rules) ? [...rules] : [];
    const idx = nextRules.findIndex((rule) => rule.field === nextRule.field);
    if (idx === -1) {
      nextRules.push(nextRule);
    } else {
      nextRules[idx] = nextRule;
    }
    return nextRules;
  };

  const updateFilters = (nextFilters) => {
    if (onBuyerFiltersChange) {
      onBuyerFiltersChange(nextFilters);
    }
  };

  const baseBuyerTypeRule = getRule(baseRules, "buyerType") || {
    field: "buyerType",
    op: "in",
    value: []
  };

  const basePreferredAreasRule = getRule(baseRules, "preferredAreas") || {
    field: "preferredAreas",
    op: "preferredAreas",
    value: [],
    match: "contains-any"
  };

  const baseBuyerTypes = Array.isArray(baseBuyerTypeRule.value) ? baseBuyerTypeRule.value : [];
  const basePreferredAreas = Array.isArray(basePreferredAreasRule.value) ? basePreferredAreasRule.value : [];
  const baseMatch = basePreferredAreasRule.match || "contains-any";

  const toggleBuyerType = (type, checked) => {
    const nextValues = checked
      ? [...baseBuyerTypes, type]
      : baseBuyerTypes.filter((value) => value !== type);

    const nextRules = upsertRule(baseRules, {
      field: "buyerType",
      op: "in",
      value: nextValues
    });

    updateFilters({ ...filters, rules: nextRules });
  };

  const updatePreferredAreas = (raw) => {
    const nextValues = raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const nextRules = upsertRule(baseRules, {
      field: "preferredAreas",
      op: "preferredAreas",
      value: nextValues,
      match: baseMatch
    });

    updateFilters({ ...filters, rules: nextRules });
  };

  const updatePreferredAreasMatch = (value) => {
    const nextRules = upsertRule(baseRules, {
      field: "preferredAreas",
      op: "preferredAreas",
      value: basePreferredAreas,
      match: value
    });

    updateFilters({ ...filters, rules: nextRules });
  };

  const toggleAdvanced = (enabled) => {
    updateFilters({
      ...filters,
      advanced: {
        ...filters.advanced,
        enabled,
        groups: advancedGroups
      }
    });
  };

  const updateGroupAt = (index, updater) => {
    const nextGroups = [...advancedGroups];
    const current = nextGroups[index] || { mode: "and", rules: [] };
    nextGroups[index] = updater(current);
    updateFilters({
      ...filters,
      advanced: {
        ...filters.advanced,
        enabled: true,
        groups: nextGroups
      }
    });
  };

  const addGroup = () => {
    updateFilters({
      ...filters,
      advanced: {
        ...filters.advanced,
        enabled: true,
        groups: [...advancedGroups, { mode: "and", rules: [] }]
      }
    });
  };

  const removeGroup = (index) => {
    const nextGroups = advancedGroups.filter((_, idx) => idx !== index);
    updateFilters({
      ...filters,
      advanced: {
        ...filters.advanced,
        enabled: advancedEnabled,
        groups: nextGroups
      }
    });
  };

  const getGroupRule = (group, field) =>
    getRule(Array.isArray(group?.rules) ? group.rules : [], field);

  const updateGroupBuyerTypes = (index, values) => {
    updateGroupAt(index, (group) => ({
      ...group,
      rules: upsertRule(group.rules || [], {
        field: "buyerType",
        op: "in",
        value: values
      })
    }));
  };

  const updateGroupPreferredAreas = (index, raw) => {
    const nextValues = raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const match =
      getGroupRule(advancedGroups[index], "preferredAreas")?.match || "contains-any";

    updateGroupAt(index, (group) => ({
      ...group,
      rules: upsertRule(group.rules || [], {
        field: "preferredAreas",
        op: "preferredAreas",
        value: nextValues,
        match
      })
    }));
  };

  const updateGroupPreferredAreasMatch = (index, value) => {
    const currentRule = getGroupRule(advancedGroups[index], "preferredAreas");
    updateGroupAt(index, (group) => ({
      ...group,
      rules: upsertRule(group.rules || [], {
        field: "preferredAreas",
        op: "preferredAreas",
        value: currentRule?.value || [],
        match: value
      })
    }));
  };

  const handleClearSearch = () => {
    if (clearSearch) {
      clearSearch();
      return;
    }

    if (onSearchChange) {
      onSearchChange("");
    }
  };

  const emptyMessage = searchQuery
    ? "No lists match your search."
    : useBuyerFilters
      ? "No lists match your buyer filters."
      : "No email lists found. Create your first list!";

  return (
    <>
      <CardHeader className="bg-[#f0f5f4] border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Email Lists</CardTitle>
          
          <div className="flex gap-2">
            <Button
              className="bg-[#324c48] text-white"
              onClick={onNewList}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create New List
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="p-4 border-b space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="w-full sm:flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by list name or description..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-10 border-[#324c48]/30"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {searchQuery && (
              <Badge variant="secondary" className="whitespace-nowrap">
                {resultCount} of {totalCount} lists
              </Badge>
            )}
          </div>

          {searchQuery && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Active search:</span>
              <Badge variant="outline" className="gap-1">
                {searchQuery}
                <button
                  onClick={handleClearSearch}
                  className="ml-1 hover:bg-gray-200 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Source</span>
              <Select value={sourceFilter} onValueChange={onSourceChange}>
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "all" ? "All sources" : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <Switch
                checked={includeGenerated}
                onCheckedChange={onIncludeGeneratedChange}
              />
              Show generated
            </label>
          </div>

          {showBuyerFilters && (
            <div className="rounded-lg border bg-white p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Buyer Filters</p>
                  <p className="text-xs text-gray-500">
                    Generate an audience snapshot across all buyers.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={useBuyerFilters}
                    onCheckedChange={(checked) => onUseBuyerFiltersChange(checked)}
                  />
                  <Label className="text-sm">Use buyer filters</Label>
                </div>
              </div>

              <fieldset
                className={useBuyerFilters ? "space-y-4" : "space-y-4 opacity-60"}
                disabled={!useBuyerFilters}
              >
                {!advancedEnabled && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Buyer Types</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {buyerTypeOptions.map((type) => {
                          const checked = baseBuyerTypes.includes(type);
                          return (
                            <label key={type} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) =>
                                  toggleBuyerType(type, Boolean(value))
                                }
                              />
                              <span>{type}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Preferred Areas</Label>
                      <Input
                        placeholder="Dallas, Plano, Austin"
                        value={basePreferredAreas.join(", ")}
                        onChange={(e) => updatePreferredAreas(e.target.value)}
                      />
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <Label className="text-sm text-gray-600">Match mode</Label>
                        <Select
                          value={baseMatch}
                          onValueChange={(value) => updatePreferredAreasMatch(value)}
                        >
                          <SelectTrigger className="sm:w-[200px]">
                            <SelectValue placeholder="Match mode" />
                          </SelectTrigger>
                          <SelectContent>
                            {matchOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Switch checked={advancedEnabled} onCheckedChange={toggleAdvanced} />
                  <Label className="text-sm">Enable advanced filter groups (OR logic)</Label>
                </div>

                {advancedEnabled && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500">
                      Each group is ANDed internally. Groups are ORed together.
                    </p>

                    {advancedGroups.map((group, index) => {
                      const groupBuyerTypes = getGroupRule(group, "buyerType")?.value || [];
                      const groupPreferredAreas = getGroupRule(group, "preferredAreas")?.value || [];
                      const groupMatch =
                        getGroupRule(group, "preferredAreas")?.match || "contains-any";

                      return (
                        <div key={`group-${index}`} className="rounded-md border p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Group {index + 1}</p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeGroup(index)}
                            >
                              Remove
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Label>Buyer Types</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {buyerTypeOptions.map((type) => {
                                const checked = groupBuyerTypes.includes(type);
                                return (
                                  <label key={type} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(value) => {
                                        const nextValues = Boolean(value)
                                          ? [...groupBuyerTypes, type]
                                          : groupBuyerTypes.filter((v) => v !== type);
                                        updateGroupBuyerTypes(index, nextValues);
                                      }}
                                    />
                                    <span>{type}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Preferred Areas</Label>
                            <Input
                              placeholder="Dallas, Plano, Austin"
                              value={
                                Array.isArray(groupPreferredAreas)
                                  ? groupPreferredAreas.join(", ")
                                  : ""
                              }
                              onChange={(e) => updateGroupPreferredAreas(index, e.target.value)}
                            />
                            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                              <Label className="text-sm text-gray-600">Match mode</Label>
                              <Select
                                value={groupMatch}
                                onValueChange={(value) =>
                                  updateGroupPreferredAreasMatch(index, value)
                                }
                              >
                                <SelectTrigger className="sm:w-[200px]">
                                  <SelectValue placeholder="Match mode" />
                                </SelectTrigger>
                                <SelectContent>
                                  {matchOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <Button type="button" variant="outline" size="sm" onClick={addGroup}>
                      Add group
                    </Button>
                  </div>
                )}
              </fieldset>

            </div>
          )}
        </div>
        
        {/* Lists Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>List Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Criteria</TableHead>
                <TableHead className="text-center">Buyers</TableHead>
                <TableHead>Last Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lists.length > 0 ? (
                lists.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell className="font-medium">
                      {list.name}
                    </TableCell>
                    <TableCell>
                      {list.description}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {list.criteria && list.criteria.areas && list.criteria.areas.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {list.criteria.areas.map((area, idx) => (
                              <Badge key={idx} variant="outline" className="bg-[#f0f5f4] text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {list.criteria && list.criteria.buyerTypes && list.criteria.buyerTypes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {list.criteria.buyerTypes.map((type, idx) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                className={`
                                  text-xs
                                  ${type === 'CashBuyer' ? 'bg-green-100 text-green-800' : ''}
                                  ${type === 'Investor' ? 'bg-blue-100 text-blue-800' : ''}
                                  ${type === 'Realtor' ? 'bg-purple-100 text-purple-800' : ''}
                                  ${type === 'Builder' ? 'bg-orange-100 text-orange-800' : ''}
                                  ${type === 'Developer' ? 'bg-yellow-100 text-yellow-800' : ''}
                                  ${type === 'Wholesaler' ? 'bg-indigo-100 text-indigo-800' : ''}
                                `}
                              >
                                {type}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {list.criteria && list.criteria.isVIP && (
                          <Badge className="bg-[#D4A017] text-white text-xs">VIP Only</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xl font-semibold">{list.buyerCount}</span>
                    </TableCell>
                    <TableCell>
                      {list.lastEmailDate ? (
                        <span className="text-sm">
                          {new Date(list.lastEmailDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[#324c48]"
                          onClick={() => onEmailList(list.id)}
                        >
                          <Mail className="h-4 w-4" />
                          <span className="sr-only">Email</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[#324c48]"
                          onClick={() => onAddBuyers(list.id)}
                        >
                          <UserPlus className="h-4 w-4" />
                          <span className="sr-only">Add Buyers</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[#324c48]"
                          onClick={() => onManageMembers(list.id)}
                        >
                          <Users className="h-4 w-4" />
                          <span className="sr-only">Manage Members</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[#324c48]"
                          onClick={() => onEditList(list.id)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => onDeleteList(list.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </>
  );
}
