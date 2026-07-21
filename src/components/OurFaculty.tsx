"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Phone } from "lucide-react";

export default function OurFaculty() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('sort_order', { ascending: true });
        
      if (data) {
        setTeachers(data);
      }
      setLoading(false);
    };
    
    fetchTeachers();
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-brand-950 mb-4">Our Dedicated Faculty</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Meet the passionate educators who inspire, guide, and shape the future of our students every single day.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            Faculty information will be updated soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teachers.map((teacher, index) => (
              <div key={teacher.id || index} className="bg-slate-50 rounded-2xl p-6 text-center shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <div className="w-32 h-32 mx-auto bg-brand-100 rounded-full overflow-hidden mb-6 border-4 border-white shadow-md group-hover:border-brand-100 transition-colors">
                  {/* Using ui-avatars as a placeholder for photos */}
                  <img 
                    src={`https://ui-avatars.com/api/?name=${teacher.first_name}+${teacher.last_name}&background=0D8ABC&color=fff&size=128&font-size=0.33`}
                    alt={`${teacher.first_name} ${teacher.last_name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  {teacher.first_name} {teacher.middle_name ? teacher.middle_name + ' ' : ''}{teacher.last_name}
                </h3>
                <div className="inline-block bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                  {teacher.subject_teach || "Faculty Member"}
                </div>
                <p className="text-slate-600 text-sm mb-2 line-clamp-2 min-h-[40px]">
                  <span className="font-semibold text-slate-700">Role:</span> {teacher.role || teacher.post || "Dedicated Teacher"}
                </p>
                {teacher.phone_number && (
                  <div className="flex items-center justify-center gap-2 text-slate-500 text-sm bg-slate-100 py-1.5 px-3 rounded-lg mx-auto w-fit">
                    <Phone className="w-4 h-4 text-brand-500" />
                    <span className="font-medium">{teacher.phone_number}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
