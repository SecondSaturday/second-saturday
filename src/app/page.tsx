import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <main className="flex w-full max-w-3xl flex-col items-center gap-8 px-8 py-16">
        <div className="text-center">
          <Badge className="mb-4">tweakcn theme: 2s6y</Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Second Saturday</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            UI Framework configured with shadcn/ui
          </p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Theme Preview</CardTitle>
            <CardDescription>
              Using Instrument Sans, Instrument Serif, and Courier Prime fonts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
            </div>
            <Input placeholder="Input field..." />
            <div className="flex gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </CardContent>
        </Card>

        <p className="font-mono text-sm text-muted-foreground">
          Dark mode support enabled via next-themes
        </p>
      </main>
    </div>
  )
}
