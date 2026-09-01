import { Info } from "@/ui/components/icon";

type InputErrorProps = {
  message: string;
};

export function InputError({ message }: InputErrorProps) {
  return (
    <p role="alert" className="text-destructive mt-2 flex items-start gap-2 text-sm">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
