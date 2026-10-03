export function SectionHeader({ title, caption }: { title: string; caption?: string }) {
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-subhead text-fg-primary">{title}</h2>
            {caption && <p className="text-body-sm text-fg-tertiary">{caption}</p>}
        </div>
    );
}
