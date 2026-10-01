interface AuthHeadingProps {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
}

export function AuthHeading({ title, description, icon }: AuthHeadingProps) {
  return (
    <div className="space-y-3 text-center">
      {icon ? (
        <div className="mx-auto mb-5 grid size-12 place-items-center rounded-md bg-background text-brand-lime [&_svg]:size-6">
          {icon}
        </div>
      ) : null}
      <h1 className="font-display text-3xl leading-none uppercase tracking-tight text-balance sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mx-auto max-w-sm text-sm text-pretty text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
