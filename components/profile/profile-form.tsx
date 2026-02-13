"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateUserProfile, deleteUserAccount } from "@/app/actions/profile";
import { useDebounce } from "@/hooks/use-debounce";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/utils/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

// Types
interface ProfileFormProps {
  initialData: {
    displayName?: string;
    timezone?: string;
    dateFormat?: string;
    timeFormat?: string;
  };
}

const timezones = Intl.supportedValuesOf('timeZone');

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    displayName: initialData.displayName || "",
    timezone: initialData.timezone || "UTC",
    dateFormat: initialData.dateFormat || "YYYY-MM-DD",
    timeFormat: initialData.timeFormat || "24h",
  });
  const [isPending, startTransition] = useTransition();
  const lastSavedData = useRef(formData);
  const [openTimezone, setOpenTimezone] = useState(false);

  // Debounce text fields
  const debouncedName = useDebounce(formData.displayName, 500);

  const handleSave = async (data: Partial<typeof formData>) => {
    try {
      await updateUserProfile(data as any);
      lastSavedData.current = { ...lastSavedData.current, ...data };
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  // Effect for Name
  useEffect(() => {
    if (debouncedName !== lastSavedData.current.displayName) {
      handleSave({ displayName: debouncedName });
    }
  }, [debouncedName]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // For selects/combobox, save immediately
    if (["timezone", "dateFormat", "timeFormat"].includes(field)) {
      handleSave({ [field]: value });
    }
  };

  const inputClasses = "h-10 w-full";

  return (
    <div className="space-y-6 w-full">
      
      {/* Personal Info */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Personal Information</h3>
          <p className="text-sm text-muted-foreground">
            Update your personal details and how you are identified.
          </p>
        </div>
        <div className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Full Name</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => handleChange("displayName", e.target.value)}
              className={inputClasses}
            />
          </div>
          <div className="space-y-2 flex flex-col">
            <Label htmlFor="timezone">Timezone</Label>
            <Popover open={openTimezone} onOpenChange={setOpenTimezone}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openTimezone}
                  className={cn(inputClasses, "justify-between font-normal")}
                >
                  {formData.timezone
                    ? formData.timezone
                    : "Select timezone..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search timezone..." />
                  <CommandList>
                    <CommandEmpty>No timezone found.</CommandEmpty>
                    <CommandGroup>
                      {timezones.map((tz) => (
                        <CommandItem
                          key={tz}
                          value={tz}
                          onSelect={(currentValue) => {
                            handleChange("timezone", currentValue);
                            setOpenTimezone(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.timezone === tz ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {tz}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </section>

      <Separator />

      {/* App Preferences */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">App Preferences</h3>
          <p className="text-sm text-muted-foreground">
            Customize how dates and times are displayed throughout the app.
          </p>
        </div>
        <div className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select
              value={formData.dateFormat}
              onValueChange={(value) => handleChange("dateFormat", value)}
            >
              <SelectTrigger id="dateFormat" className={inputClasses}>
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
           <div className="space-y-2">
            <Label htmlFor="timeFormat">Time Format</Label>
            <Select
              value={formData.timeFormat}
              onValueChange={(value) => handleChange("timeFormat", value)}
            >
               <SelectTrigger id="timeFormat" className={inputClasses}>
                <SelectValue placeholder="Select time format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12h (AM/PM)</SelectItem>
                <SelectItem value="24h">24h (14:00)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <Separator />

      {/* Delete Account */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-destructive">Delete Account</h3>
          <p className="text-sm text-muted-foreground">
             Deleting your account is permanent. You will immediately lose access to all your data. Here’s how to export your data first.
          </p>
        </div>
        
        <Button 
            variant="destructive" 
            onClick={() => {
                if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                    startTransition(async () => {
                        await deleteUserAccount();
                    });
                }
            }}
            disabled={isPending}
            className="h-10"
        >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Account
        </Button>
      </section>
    </div>
  );
}