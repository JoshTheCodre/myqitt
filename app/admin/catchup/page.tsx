'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { AppShell } from '@/components/layout/app-shell'
import { Plus, Edit2, Trash2, X, Save, Calendar, Target, Image as ImageIcon, FileText, Link as LinkIcon, Eye } from 'lucide-react'
import { CatchUpService, type CatchUpItem } from '@/lib/services/catchUpService'
import { supabase } from '@/lib/supabase/client'
import ReactMarkdown from 'react-markdown'

interface CatchUpFormData {
  title: string
  summary: string
  image_url: string
  content_md: string
  cta_label: string
  cta_url: string
  global: boolean
  schools: string[]
  departments: string[]
  levels: number[]
  class_groups: string[]
  expires_at: string
}

const emptyForm: CatchUpFormData = {
  title: '',
  summary: '',
  image_url: '',
  content_md: '',
  cta_label: '',
  cta_url: '',
  global: true,
  schools: [],
  departments: [],
  levels: [],
  class_groups: [],
  expires_at: ''
}

export default function CatchUpAdminPage() {
  const { profile, user, initialized } = useAuthStore()
  const [items, setItems] = useState<CatchUpItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CatchUpFormData>(emptyForm)
  const [showPreview, setShowPreview] = useState(false)
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (initialized && user) {
      loadItems()
      loadSchools()
    } else if (initialized && !user) {
      setLoading(false)
    }
  }, [initialized, user])

  async function loadItems() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('catchups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading catch-up items:', error)
        alert('Failed to load catch-up items: ' + error.message)
      } else {
        setItems(data as CatchUpItem[])
      }
    } catch (error) {
      console.error('Error loading catch-up items:', error)
      alert('Failed to load catch-up items')
    } finally {
      setLoading(false)
    }
  }

  async function loadSchools() {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .order('name')

      if (error) throw error
      setSchools(data || [])
    } catch (error) {
      console.error('Error loading schools:', error)
    }
  }

  function handleEdit(item: CatchUpItem) {
    setEditingId(item.id)
    setFormData({
      title: item.title,
      summary: item.summary,
      image_url: item.image_url || '',
      content_md: item.content_md || '',
      cta_label: item.cta?.label || '',
      cta_url: item.cta?.url || '',
      global: item.targets.global,
      schools: item.targets.schools,
      departments: item.targets.departments,
      levels: item.targets.levels,
      class_groups: item.targets.class_groups || [],
      expires_at: item.expires_at ? new Date(item.expires_at).toISOString().slice(0, 16) : ''
    })
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this catch-up item?')) return

    try {
      const { error } = await supabase
        .from('catchups')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setItems(items.filter(item => item.id !== id))
      alert('Catch-up item deleted successfully!')
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const targets = {
      global: formData.global,
      schools: formData.schools,
      departments: formData.departments,
      levels: formData.levels,
      class_groups: formData.class_groups
    }

    const cta = formData.cta_label && formData.cta_url 
      ? { label: formData.cta_label, url: formData.cta_url }
      : null

    const payload: any = {
      title: formData.title,
      summary: formData.summary,
      image_url: formData.image_url || null,
      content_md: formData.content_md || null,
      cta,
      targets,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null
    }

    // For updates, we need to include updated_at
    if (editingId) {
      payload.updated_at = new Date().toISOString()
    }

    try {
      if (editingId) {
        // Update
        console.log('Updating with payload:', payload)
        const { data, error } = await supabase
          .from('catchups')
          .update(payload)
          .eq('id', editingId)
          .select()

        if (error) {
          console.error('Update error:', error)
          throw error
        }
        console.log('Update response:', data)
        alert('Catch-up item updated successfully!')
      } else {
        // Create
        console.log('Creating with payload:', payload)
        const { data, error } = await supabase
          .from('catchups')
          .insert(payload)
          .select()

        if (error) {
          console.error('Insert error:', error)
          throw error
        }
        console.log('Insert response:', data)
        alert('Catch-up item created successfully!')
      }

      setShowForm(false)
      setEditingId(null)
      setFormData(emptyForm)
      await loadItems()
    } catch (error: any) {
      console.error('Error saving item:', error)
      alert(`Failed to save item: ${error.message || 'Unknown error'}`)
    }
  }

  function handleCancel() {
    setShowForm(false)
    setEditingId(null)
    setFormData(emptyForm)
  }

  function toggleLevel(level: number) {
    setFormData(prev => ({
      ...prev,
      levels: prev.levels.includes(level)
        ? prev.levels.filter(l => l !== level)
        : [...prev.levels, level]
    }))
  }

  function toggleClassGroup(classGroup: string) {
    setFormData(prev => ({
      ...prev,
      class_groups: prev.class_groups.includes(classGroup)
        ? prev.class_groups.filter(cg => cg !== classGroup)
        : [...prev.class_groups, classGroup]
    }))
  }

  if (!initialized || loading) {
    return (
      <AppShell>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!user) {
    return (
      <AppShell>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Please log in to access this page.</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-8 pb-24 lg:pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Catch-Up Items</h1>
              <p className="text-gray-600 mt-1">Manage announcements and updates for students</p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Item
              </button>
            )}
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? 'Edit Catch-Up Item' : 'Create New Catch-Up Item'}
                </h2>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Form */}
                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Welcome to MyQitt!"
                      />
                    </div>

                    {/* Summary */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Summary *
                      </label>
                      <textarea
                        required
                        value={formData.summary}
                        onChange={e => setFormData({ ...formData, summary: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                        placeholder="Brief description of the announcement"
                      />
                    </div>

                    {/* Image URL */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <ImageIcon className="w-4 h-4 inline mr-1" />
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    {/* Content Markdown */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <FileText className="w-4 h-4 inline mr-1" />
                        Content (Markdown)
                      </label>
                      <textarea
                        value={formData.content_md}
                        onChange={e => setFormData({ ...formData, content_md: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm h-48"
                        placeholder="## Heading&#10;&#10;- List item 1&#10;- List item 2&#10;&#10;**Bold text**"
                      />
                    </div>

                    {/* CTA */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <LinkIcon className="w-4 h-4 inline mr-1" />
                        Call to Action (Optional)
                      </label>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={formData.cta_label}
                          onChange={e => setFormData({ ...formData, cta_label: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Button label (e.g., View Dashboard)"
                        />
                        <input
                          type="text"
                          value={formData.cta_url}
                          onChange={e => setFormData({ ...formData, cta_url: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="URL (e.g., /dashboard or https://...)"
                        />
                      </div>
                    </div>

                    {/* Expiry Date */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Expires At (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.expires_at}
                        onChange={e => setFormData({ ...formData, expires_at: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Right Column - Targeting & Preview */}
                  <div className="space-y-4">
                    {/* Targeting */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <Target className="w-4 h-4 inline mr-1" />
                        Target Audience
                      </label>

                      {/* Global Toggle */}
                      <div className="mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.global}
                            onChange={e => setFormData({ ...formData, global: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Show to all users</span>
                        </label>
                      </div>

                      {!formData.global && (
                        <div className="space-y-4">
                          {/* Schools */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-2">Schools</label>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {schools.map(school => (
                                <label key={school.id} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={formData.schools.includes(school.id)}
                                    onChange={e => {
                                      setFormData(prev => ({
                                        ...prev,
                                        schools: e.target.checked
                                          ? [...prev.schools, school.id]
                                          : prev.schools.filter(id => id !== school.id)
                                      }))
                                    }}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">{school.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Departments */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-2">Departments (comma-separated)</label>
                            <input
                              type="text"
                              value={formData.departments.join(', ')}
                              onChange={e => setFormData({ 
                                ...formData, 
                                departments: e.target.value.split(',').map(d => d.trim()).filter(d => d)
                              })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="computer_science, nursing"
                            />
                          </div>

                          {/* Levels */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-2">Levels</label>
                            <div className="flex flex-wrap gap-2">
                              {[1, 2, 3, 4, 5, 6].map(level => (
                                <button
                                  key={level}
                                  type="button"
                                  onClick={() => toggleLevel(level)}
                                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                    formData.levels.includes(level)
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {level}00
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Preview */}
                    {showPreview && formData.content_md && (
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Markdown Preview</h3>
                        <div className="prose prose-sm max-w-none bg-white rounded p-4">
                          <ReactMarkdown>{formData.content_md}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-600">No catch-up items yet. Create your first one!</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{item.summary}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" />
                          {CatchUpService.formatTargetInfo(item)}
                        </span>
                        {item.expires_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {CatchUpService.formatExpiryDate(item.expires_at)}
                          </span>
                        )}
                        {item.cta && (
                          <span className="flex items-center gap-1">
                            <LinkIcon className="w-3.5 h-3.5" />
                            Has CTA
                          </span>
                        )}
                        {item.image_url && (
                          <span className="flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5" />
                            Has Image
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
