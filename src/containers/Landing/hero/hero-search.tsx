"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { InputWithIcon } from "@/components/form-field";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { cn } from "@/utils/cn";

export function HeroSearch() {
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  return (
    <div className="mx-auto flex gap-2 justify-between max-w-lg w-full items-center rounded-sm bg-[#212226] p-1 shadow-2xl backdrop-blur-md">
      <InputWithIcon icon={Search}>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Search athletes, teams, or leagues"
          onChange={(e) => setSearchValue(e.target.value)}
          className={cn(
            "flex-1  w-full h-10 rounded-sm border-transparent text-sm shadow-none placeholder:text-muted-foreground/50 focus-visible:border-0 focus-visible:ring-0",
            "pl-10",
          )}
        />
      </InputWithIcon>
      <Button
        type="submit"
        disabled={!searchValue}
        variant="accent"
        size="default"
        isLoading={isSearching}
      >
        Search
      </Button>
    </div>
  );
}
