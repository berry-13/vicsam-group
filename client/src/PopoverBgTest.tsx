export default function PopoverBgTest() {
  return (
    <div style={{ padding: 32 }}>
      <div className="bg-white text-popover-foreground p-8 m-8 rounded shadow mb-4">
        <div className="bg-popover text-popover-foreground p-2 rounded shadow">
          This box uses bg-popover and text-popover-foreground
        </div>
      </div>
    </div>
  );
}
