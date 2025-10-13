import { toast as sonnerToast } from "sonner"

export const useToast = () => {
  const toast = ({ title, description, variant, ...props }) => {
    if (variant === "destructive") {
      return sonnerToast.error(title, {
        description,
        ...props,
      })
    }
    return sonnerToast(title, {
      description,
      ...props,
    })
  }

  return { toast }
}
