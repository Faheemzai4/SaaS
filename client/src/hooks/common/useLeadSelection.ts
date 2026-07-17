import { useCallback, useMemo, useState } from "react";

export function useLeadSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedIdSet = useMemo(
    () => new Set(selectedIds),
    [selectedIds],
  );

  const toggleLead = useCallback((id: string) => {
    setSelectedIds((currentIds) => {
      if (currentIds.includes(id)) {
        return currentIds.filter(
          (selectedId) => selectedId !== id,
        );
      }

      return [...currentIds, id];
    });
  }, []);

  const toggleAll = useCallback(
    (ids: string[]) => {
      setSelectedIds((currentIds) => {
        const currentIdSet = new Set(currentIds);

        const allSelected =
          ids.length > 0 &&
          ids.every((id) => currentIdSet.has(id));

        if (allSelected) {
          return currentIds.filter(
            (selectedId) => !ids.includes(selectedId),
          );
        }

        return Array.from(
          new Set([...currentIds, ...ids]),
        );
      });
    },
    [],
  );

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(Array.from(new Set(ids)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIdSet.has(id),
    [selectedIdSet],
  );

  const areAllSelected = useCallback(
    (ids: string[]) => {
      return (
        ids.length > 0 &&
        ids.every((id) => selectedIdSet.has(id))
      );
    },
    [selectedIdSet],
  );

  return {
    selectedIds,
    selectedCount: selectedIds.length,
    toggleLead,
    toggleAll,
    selectAll,
    clearSelection,
    isSelected,
    areAllSelected,
  };
}