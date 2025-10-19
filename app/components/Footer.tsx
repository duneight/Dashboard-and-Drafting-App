export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border/40">
      <div className="container flex h-14 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          &copy; {currentYear} Fantasy NHL Stats. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
