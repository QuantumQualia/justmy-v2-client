"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Tree, type NodeModel } from "@minoru/react-dnd-treeview";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { appsService, type AppNavigationResponseDto } from "@/lib/services/apps";
import type { AppResponseDto } from "@/lib/services/apps";
import { toast } from "sonner";
import { Loader2, Save, Home, GripVertical, Trash2 } from "lucide-react";
import debounce from "lodash/debounce";

interface MenuNodeData {
  label: string;
  path: string;
  isHome: boolean;
}

type MenuTreeNode = NodeModel<MenuNodeData>;

export default function NavigationManagerPage() {
  const router = useRouter();
  const params = useParams();
  const appId = parseInt(params.id as string, 10);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [app, setApp] = useState<AppResponseDto | null>(null);
  const [treeData, setTreeData] = useState<MenuTreeNode[]>([]);

  useEffect(() => {
    loadAppAndNavigation();
  }, [appId]);

  const loadAppAndNavigation = debounce(async () => {
    try {
      setLoadingData(true);
      const [appData, navigation] = await Promise.all([
        appsService.getAppById(appId),
        appsService.getAppNavigationByAppId(appId),
      ]);

      setApp(appData);
      const appName = appData.name;

      const safeNavigation: AppNavigationResponseDto[] = navigation ?? [];

      let nextId = 1;
      const nodes: MenuTreeNode[] = [];

      const walk = (items: AppNavigationResponseDto[], parent: number | null) => {
        items.forEach((item) => {
          const id = nextId++;
          nodes.push({
            id,
            parent: parent ?? 0,
            droppable: true,
            text: item.label,
            data: {
              label: item.label,
              path: item.path ?? "",
              isHome: item.isHome ?? false,
            },
          });
          if (item.children && item.children.length > 0) {
            walk(item.children, id);
          }
        });
      };

      if (safeNavigation.length > 0) {
        walk(safeNavigation, null);
      } else {
        nodes.push({
          id: nextId++,
          parent: 0,
          droppable: true,
          text: appName,
          data: {
            label: appName,
            path: "",
            isHome: true,
          },
        });
      }

      setTreeData(nodes);
    } catch (error) {
      console.error("Failed to load app or navigation:", error);
      toast.error("Failed to load app navigation");
      router.push("/admin/apps");
    } finally {
      setLoadingData(false);
    }
  }, 750);

  const updateNode = (id: number, data: Partial<MenuNodeData>) => {
    setTreeData((prev) =>
      prev.map((node) => {
        if (node.id !== id) return node;
        const currentData: MenuNodeData = {
          label: node.data?.label ?? node.text ?? "",
          path: node.data?.path ?? "",
          isHome: node.data?.isHome ?? false,
        };
        return {
          ...node,
          data: {
            ...currentData,
            ...data,
          },
        };
      })
    );
  };

  const handleLabelChange = (id: number, label: string) => {
    updateNode(id, { label });
  };

  const handlePathChange = (id: number, path: string) => {
    updateNode(id, { path });
  };

  const handleSetHome = (id: number) => {
    setTreeData((prev) =>
      prev.map((node) => {
        const currentData: MenuNodeData = {
          label: node.data?.label ?? node.text ?? "",
          path: node.data?.path ?? "",
          isHome: node.data?.isHome ?? false,
        };
        return {
          ...node,
          data: {
            ...currentData,
            isHome: node.id === id,
          },
        };
      })
    );
  };

  const getNextId = () =>
    treeData.length === 0
      ? 1
      : Math.max(...treeData.map((n) => Number(n.id) || 0)) + 1;

  const handleAddRootItem = () => {
    const appName = `Menu ${treeData.length + 1}`;
    const id = getNextId();

    setTreeData((prev) => [
      ...prev,
      {
        id,
        parent: 0,
        droppable: true,
        text: appName,
        data: {
          label: appName,
          path: "",
          isHome: prev.length === 0,
        },
      },
    ]);
  };

  const handleRemoveNode = (id: number) => {
    setTreeData((prev) => {
      const toRemove = new Set<number>();

      const collect = (targetId: number) => {
        toRemove.add(targetId);
        prev
          .filter((n) => n.parent === targetId)
          .forEach((child) => collect(child.id as number));
      };

      collect(id);
      return prev.filter((n) => !toRemove.has(n.id as number));
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const buildTree = (parentId: number): AppNavigationResponseDto[] => {
        return treeData
          .filter((node) => node.parent === parentId)
          .map((node) => ({
            label: node.data?.label ?? node.text ?? "",
            path: node.data?.path ?? "/",
            isHome: node.data?.isHome ?? false,
            isActive: true,
            children: buildTree(node.id as number),
          }));
      };

      const menu = buildTree(0);

      await appsService.createAppNavigation({
        appId,
        menu,
      });

      await loadAppAndNavigation();
      toast.success("Navigation updated successfully");
    } catch (error) {
      console.error("Failed to save navigation:", error);
      toast.error("Failed to save navigation");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-black p-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Navigation Manager - {app?.name}
            </h1>
            <p className="text-slate-400 mt-2">Manage app navigation order and homepages</p>
          </div>
          <Button
            onClick={() => router.push("/admin/apps")}
            variant="outline"
            className="border-slate-700 bg-slate-800/50 text-slate-200 hover:text-white hover:bg-slate-700/50"
          >
            Back to Apps
          </Button>
        </div>

        <div className="border border-slate-700 rounded-xl bg-slate-900/30 p-6 space-y-4">
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Navigation Menus (Tree view, drag to reorder / nest)
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRootItem}
                className="border-slate-700 bg-slate-800/50 text-slate-200 hover:text-white hover:bg-slate-700/50"
              >
                Add Root Menu
              </Button>
            </div>
            {treeData.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p>No navigation items found</p>
              </div>
            ) : (
              <DndProvider backend={HTML5Backend}>
                <div className="border border-slate-800 rounded-lg bg-black/40 p-4">
                  <Tree
                    tree={treeData}
                    rootId={0}
                    render={(node, params) => {
                      const { depth, isOpen, onToggle, hasChild } = params;
                      const dragHandleProps =
                        (params as any).dragHandleProps || {};

                      return (
                        <MenuTreeNodeRow
                          key={node.id}
                          node={node as MenuTreeNode}
                          depth={depth}
                          isOpen={isOpen}
                          hasChild={hasChild}
                          onToggle={onToggle}
                          onLabelChange={handleLabelChange}
                          onPathChange={handlePathChange}
                          onSetHome={handleSetHome}
                          onRemove={handleRemoveNode}
                          dragHandleProps={dragHandleProps}
                        />
                      );
                    }}
                    dragPreviewRender={(monitorProps) => (
                      <div className="px-3 py-2 rounded bg-slate-800 text-white text-sm shadow-lg">
                        {monitorProps.item.text}
                      </div>
                    )}
                    onDrop={setTreeData}
                    classes={{
                      root: "space-y-1",
                      draggingSource: "opacity-50",
                      dropTarget: "bg-slate-800/60",
                    }}
                  />
                </div>
              </DndProvider>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Navigation
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MenuTreeNodeRowProps {
  node: MenuTreeNode;
  depth: number;
  isOpen: boolean;
  hasChild: boolean;
  onToggle: () => void;
  onLabelChange: (id: number, label: string) => void;
  onPathChange: (id: number, path: string) => void;
  onSetHome: (id: number) => void;
  onRemove: (id: number) => void;
  dragHandleProps: React.HTMLAttributes<HTMLButtonElement>;
}

function MenuTreeNodeRow({
  node,
  depth,
  isOpen,
  hasChild,
  onToggle,
  onLabelChange,
  onPathChange,
  onSetHome,
  onRemove,
  dragHandleProps,
}: MenuTreeNodeRowProps) {
  const data = node.data as MenuNodeData | undefined;

  return (
    <div
      className="flex items-center gap-3 py-1"
      style={{ marginLeft: depth * 16 }}
    >
      {hasChild && (
        <button
          type="button"
          onClick={onToggle}
          className="w-6 text-xs text-slate-400 hover:text-slate-200"
        >
          {isOpen ? "-" : "+"}
        </button>
      )}
      {!hasChild && <span className="w-6" />}

      <button
        type="button"
        {...dragHandleProps}
        className="mr-1 text-slate-500 hover:text-slate-200 cursor-grab"
        title="Drag to reorder / nest"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 grid grid-cols-2 gap-2">
        <div>
          <Label className="sr-only">Label</Label>
          <Input
            value={data?.label ?? node.text ?? ""}
            onChange={(e) => onLabelChange(node.id as number, e.target.value)}
            placeholder="Menu label"
            className="bg-black/40 border-slate-700 text-white h-8 text-sm"
          />
        </div>
        <div>
          <Label className="sr-only">Path</Label>
          <Input
            value={data?.path ?? ""}
            onChange={(e) => onPathChange(node.id as number, e.target.value)}
            placeholder="/path"
            className="bg-black/40 border-slate-700 text-white h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSetHome(node.id as number)}
          className={`p-2 rounded-full border ${
            data?.isHome
              ? "bg-blue-600 border-blue-500 text-white"
              : "border-slate-700 text-slate-300 hover:bg-slate-800"
          }`}
          title="Set as home"
        >
          <Home className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onRemove(node.id as number)}
          className="p-2 rounded-full border border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/80"
          title="Remove menu item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
