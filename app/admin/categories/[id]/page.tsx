import { createClient } from "@/lib/supabase/server"; 
import EditCategoryForm from "@/components/category/EditCategoryForm"; 
import { notFound } from "next/navigation"; 

interface Props {   
  params: Promise<{     
    id: string;   
  }>; 
}

export default async function EditCategoryPage({ params }: Props) {   
  const { id } = await params;   
  const supabase = await createClient();   
  const { data } = await supabase     
    .from("categories")     
    .select("*")     
    .eq("id", id)     
    .single();   

  if (!data) {     
    notFound();   
  }

  return <EditCategoryForm category={data} />;
}